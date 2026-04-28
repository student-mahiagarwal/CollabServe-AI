import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import {
    ArrowLeft,
    Bot,
    Folder,
    Play,
    Plus,        // ➕ for collaborator
    FilePlus,    // 📄➕ for file
    Send,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import axios from '../config/axios.js';
import { disconnectSocket, initializeSocket, receiveMessage, sendMessage } from '../config/socket.js';
import { getWebContainer } from '../config/webcontainer.js';
import { useUser } from '../context/UserContext.jsx';

function getFileContent(fileTree, fileName) {
    return fileTree?.[ fileName ]?.file?.contents || '';
}

function toWebContainerTree(flatTree) {
    const root = {};

    Object.entries(flatTree || {}).forEach(([ path, value ]) => {
        const parts = path.split('/').filter(Boolean);
        let cursor = root;

        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                cursor[ part ] = {
                    file: {
                        contents: value?.file?.contents || '',
                    },
                };
                return;
            }

            if (!cursor[ part ]) {
                cursor[ part ] = { directory: {} };
            }

            cursor = cursor[ part ].directory;
        });
    });

    return root;
}

function CodeBlock(props) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            hljs.highlightElement(ref.current);
        }
    }, [ props.children ]);

    return <code {...props} ref={ref} />;
}

function AiMessage({ message }) {
    let parsed = null;

    try {
        parsed = JSON.parse(message);
    } catch {
        parsed = { text: message };
    }

    return (
        <div className="prose prose-sm max-w-none prose-pre:bg-stone-950 prose-pre:text-stone-50">
            <Markdown options={{ overrides: { code: CodeBlock } }}>
                {parsed.text || message}
            </Markdown>
        </div>
    );
}

export default function Project() {
    const { projectId } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();
    const messageBoxRef = useRef(null);

    const [ project, setProject ] = useState(null);
    const [ users, setUsers ] = useState([]);
    const [ selectedUserIds, setSelectedUserIds ] = useState(new Set());
    const [ isCollaboratorModalOpen, setIsCollaboratorModalOpen ] = useState(false);
    const [ isMemberPanelOpen, setIsMemberPanelOpen ] = useState(false);
    const [ message, setMessage ] = useState('');
    const [ messages, setMessages ] = useState([]);
    const [ fileTree, setFileTree ] = useState({});
    const [ currentFile, setCurrentFile ] = useState('');
    const [ openFiles, setOpenFiles ] = useState([]);
    const [ webContainer, setWebContainer ] = useState(null);
    const [ iframeUrl, setIframeUrl ] = useState('');
    const [ runProcess, setRunProcess ] = useState(null);
    const [ terminalOutput, setTerminalOutput ] = useState('');
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState('');

    const fileNames = useMemo(() => Object.keys(fileTree), [ fileTree ]);

    const openFile = useCallback(fileName => {
    setCurrentFile(fileName);
    setOpenFiles(prev => Array.from(new Set([ ...prev, fileName ])));
}, []);

// 👇 ADD HERE
const handleAddFile = () => {
    const fileName = prompt("Enter file name (e.g. index.html)");

    if (!fileName) return;

    const newFileTree = {
        ...fileTree,
        [fileName]: {
            file: { contents: "" }
        }
    };

    setFileTree(newFileTree);
    saveFileTree(newFileTree);
    openFile(fileName);
};

    const saveFileTree = useCallback(async nextFileTree => {
        if (!projectId) {
            return;
        }

        try {
            await axios.put('/projects/update-file-tree', {
                projectId,
                fileTree: nextFileTree,
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Could not save files');
        }
    }, [ projectId ]);

    useEffect(() => {
        async function boot() {
            try {
                const [ projectRes, usersRes ] = await Promise.all([
                    axios.get(`/projects/get-project/${projectId}`),
                    axios.get('/users/all'),
                ]);

                const nextProject = projectRes.data.project;
                setProject(nextProject);
                setUsers(usersRes.data.users);
                setFileTree(nextProject.fileTree || {});

                const firstFile = Object.keys(nextProject.fileTree || {})[ 0 ];
                if (firstFile) {
                    openFile(firstFile);
                }

                initializeSocket(projectId);
                receiveMessage('project-message', data => {
                    setMessages(prev => [ ...prev, data ]);

                    if (data.sender?._id === 'ai') {
                        try {
                            const parsed = JSON.parse(data.message);

                            if (parsed.fileTree && Object.keys(parsed.fileTree).length > 0) {
                                setFileTree(prev => {
                                    const nextTree = { ...prev, ...parsed.fileTree };
                                    saveFileTree(nextTree);
                                    const nextFirstFile = Object.keys(parsed.fileTree)[ 0 ];

                                    if (nextFirstFile) {
                                        openFile(nextFirstFile);
                                    }

                                    return nextTree;
                                });
                            }
                        } catch (parseError) {
                            console.warn(parseError);
                        }
                    }
                });

                getWebContainer()
                    .then(setWebContainer)
                    .catch(err => setTerminalOutput(`WebContainer failed: ${err.message}`));
            } catch (err) {
                setError(err.response?.data?.error || 'Could not load project');
            } finally {
                setLoading(false);
            }
        }

        boot();

        return () => {
            disconnectSocket();
        };
    }, [ openFile, projectId, saveFileTree ]);

    useEffect(() => {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
        }
    }, [ messages ]);

    function toggleSelectedUser(id) {
        setSelectedUserIds(prev => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }

    async function addCollaborators() {
        try {
            const res = await axios.put('/projects/add-user', {
                projectId,
                users: Array.from(selectedUserIds),
            });

            setProject(res.data.project);
            setSelectedUserIds(new Set());
            setIsCollaboratorModalOpen(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not add collaborators');
        }
    }

    function submitMessage(event) {
        event.preventDefault();

        if (!message.trim()) {
            return;
        }

        const nextMessage = {
            message,
            sender: user,
            createdAt: new Date().toISOString(),
        };

        sendMessage('project-message', nextMessage);
        setMessages(prev => [ ...prev, nextMessage ]);
        setMessage('');
    }

    function updateCurrentFile(contents) {
        const nextFileTree = {
            ...fileTree,
            [ currentFile ]: {
                file: { contents },
            },
        };

        setFileTree(nextFileTree);
        saveFileTree(nextFileTree);
    }

    async function runProject() {
    if (!webContainer || fileNames.length === 0) {
        return;
    }

    setTerminalOutput('Mounting files...\n');
    await webContainer.mount(toWebContainerTree(fileTree));

    const packageJson = JSON.parse(getFileContent(fileTree, 'package.json') || '{}');

    const installCommand = packageJson.dependencies || packageJson.devDependencies
        ? ['npm', ['install']]
        : null;

    const startScript = packageJson.scripts?.dev
        ? 'dev'
        : packageJson.scripts?.start
        ? 'start'
        : null;

    // ✅ INSTALL
    if (installCommand) {
        setTerminalOutput(prev => `${prev}Installing dependencies...\n`);
        const installProcess = await webContainer.spawn(installCommand[0], installCommand[1]);

        installProcess.output.pipeTo(new WritableStream({
            write(chunk) {
                setTerminalOutput(prev => `${prev}${chunk}`);
            },
        }));

        await installProcess.exit;
    }

    // ✅ KILL PREVIOUS PROCESS
    if (runProcess) {
        runProcess.kill();
    }

    let nextRunProcess;

    // 🔥 SMART RUN LOGIC
    if (currentFile?.endsWith(".js")) {
        setTerminalOutput(prev => `${prev}\nRunning ${currentFile} with node...\n`);

        nextRunProcess = await webContainer.spawn("node", [currentFile]);
    }
    else if (startScript) {
        setTerminalOutput(prev => `${prev}\nRunning npm ${startScript}...\n`);

        nextRunProcess = await webContainer.spawn("npm", ["run", startScript]);
    }
    else {
        setTerminalOutput(prev => `${prev}\nNo runnable file or script found`);
        return;
    }

    // ✅ OUTPUT STREAM
    nextRunProcess.output.pipeTo(new WritableStream({
        write(chunk) {
            setTerminalOutput(prev => `${prev}${chunk}`);
        },
    }));

    setRunProcess(nextRunProcess);

    // ✅ SERVER READY (only for npm apps)
    webContainer.on('server-ready', (port, url) => {
        setTerminalOutput(prev => `${prev}\nServer ready on ${port}: ${url}\n`);
        setIframeUrl(url);
    });
}

    return (
        <main className="grid h-screen grid-cols-[360px_1fr] overflow-hidden bg-stone-100">
            <section className="relative flex min-h-0 flex-col border-r border-stone-300 bg-white">
                <header className="flex h-14 items-center justify-between border-b border-stone-200 px-3">
                    <button
                        onClick={() => navigate('/')}
                        className="grid h-9 w-9 place-items-center rounded-md text-stone-700 hover:bg-stone-100"
                        title="Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="truncate px-2 text-sm font-semibold text-stone-950">{project?.name}</h1>
                    <button
                        onClick={() => setIsMemberPanelOpen(true)}
                        className="grid h-9 w-9 place-items-center rounded-md text-stone-700 hover:bg-stone-100"
                        title="Collaborators"
                    >
                        <Users size={18} />
                    </button>
                </header>

                <div ref={messageBoxRef} className="scrollbar-thin flex-1 space-y-3 overflow-auto p-3">
                    {messages.map((msg, index) => {
                        const isOwn = msg.sender?._id === user?._id;
                        const isAi = msg.sender?._id === 'ai';

                        return (
                            <div key={`${msg.createdAt}-${index}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[82%] rounded-lg border px-3 py-2 text-sm shadow-sm ${isAi ? 'border-emerald-200 bg-emerald-50' : isOwn ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-stone-50 text-stone-900'}`}>
                                    <div className="mb-1 flex items-center gap-1.5 text-xs opacity-70">
                                        {isAi && <Bot size={13} />}
                                        <span>{msg.sender?.email}</span>
                                    </div>
                                    {isAi ? <AiMessage message={msg.message} /> : <p className="whitespace-pre-wrap">{msg.message}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={submitMessage} className="flex border-t border-stone-200 p-3">
                    <input
                        value={message}
                        onChange={event => setMessage(event.target.value)}
                        className="min-w-0 flex-1 rounded-l-md border border-r-0 border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                        placeholder="Message or @ai prompt"
                    />
                    <button className="grid w-11 place-items-center rounded-r-md bg-emerald-700 text-white hover:bg-emerald-800" title="Send">
                        <Send size={18} />
                    </button>
                </form>

                {isMemberPanelOpen && (
                    <aside className="absolute inset-0 z-30 flex flex-col bg-white shadow-xl">
                        <header className="flex h-14 items-center justify-between border-b border-stone-200 px-4">
                            <h2 className="text-sm font-semibold text-stone-950">Collaborators</h2>
                            <button onClick={() => setIsMemberPanelOpen(false)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-stone-100" title="Close">
                                <X size={18} />
                            </button>
                        </header>
                        <div className="scrollbar-thin flex-1 overflow-auto p-3">
                            <button
                                onClick={() => setIsCollaboratorModalOpen(true)}
                                className="mb-3 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                            >
                                <UserPlus size={17} />
                                Add
                            </button>
                            <div className="space-y-2">
                                {project?.users?.map(member => (
                                    <div key={member._id} className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800">
                                        {member.email}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                )}
            </section>

            <section className="grid min-w-0 grid-cols-[240px_1fr] overflow-hidden">
                <aside className="flex min-h-0 flex-col border-r border-stone-300 bg-stone-200">
                    <div className="flex h-12 items-center justify-between border-b border-stone-300 px-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                            <Folder size={17} />
                            Files
                        </div>
                       <div className="flex items-center gap-2">

    {/* 📄➕ Add File */}
    <button
        onClick={handleAddFile}
        className="grid h-8 w-8 place-items-center rounded-md text-stone-700 hover:bg-stone-300"
        title="New File"
    >
        <FilePlus size={17} />
    </button>

    {/* ➕ Add Collaborator */}
    <button
        onClick={() => setIsCollaboratorModalOpen(true)}
        className="grid h-8 w-8 place-items-center rounded-md text-stone-700 hover:bg-stone-300"
        title="Add Collaborator"
    >
        <Plus size={17} />
    </button>

</div>
                    </div>
                    <div className="scrollbar-thin flex-1 overflow-auto p-2">
                        {fileNames.map(file => (
                            <button
                                key={file}
                                onClick={() => openFile(file)}
                                className={`mb-1 block w-full truncate rounded-md px-3 py-2 text-left text-sm ${currentFile === file ? 'bg-white font-medium text-emerald-800 shadow-sm' : 'text-stone-700 hover:bg-stone-100'}`}
                            >
                                {file}
                            </button>
                        ))}
                    </div>
                </aside>

                <div className="grid min-w-0 grid-rows-[48px_1fr_210px] overflow-hidden bg-white">
                    <header className="flex items-center justify-between border-b border-stone-200">
                        <div className="scrollbar-thin flex min-w-0 flex-1 overflow-x-auto">
                            {openFiles.map(file => (
                                <button
                                    key={file}
                                    onClick={() => setCurrentFile(file)}
                                    className={`h-12 min-w-36 max-w-56 truncate border-r border-stone-200 px-3 text-left text-sm ${currentFile === file ? 'bg-stone-50 font-medium text-stone-950' : 'text-stone-600 hover:bg-stone-50'}`}
                                >
                                    {file}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={runProject}
                            className="mr-3 inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
                            disabled={!webContainer || fileNames.length === 0}
                        >
                            <Play size={17} />
                            Run
                        </button>
                    </header>

                    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(320px,40%)] overflow-hidden">
                        <div className="min-w-0 overflow-hidden">
                            {currentFile ? (
                                <textarea
                                    value={getFileContent(fileTree, currentFile)}
                                    onChange={event => {
                                        const nextFileTree = {
                                            ...fileTree,
                                            [ currentFile ]: { file: { contents: event.target.value } },
                                        };
                                        setFileTree(nextFileTree);
                                    }}
                                    onBlur={event => updateCurrentFile(event.target.value)}
                                    spellCheck={false}
                                    className="h-full w-full resize-none bg-stone-950 p-4 font-mono text-sm leading-6 text-stone-50 outline-none"
                                />
                            ) : (
                                <div className="grid h-full place-items-center text-sm text-stone-500">No files yet</div>
                            )}
                        </div>

                        <div className="flex min-w-0 flex-col border-l border-stone-200 bg-stone-50">
                            <div className="border-b border-stone-200 p-2">
                                <input
                                    value={iframeUrl}
                                    onChange={event => setIframeUrl(event.target.value)}
                                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600"
                                    placeholder="Preview URL"
                                />
                            </div>
                            {iframeUrl ? (
                                <iframe title="Preview" src={iframeUrl} className="h-full w-full flex-1 bg-white" />
                            ) : (
                                <div className="grid flex-1 place-items-center text-sm text-stone-500">Preview appears after run</div>
                            )}
                        </div>
                    </div>

                    <pre className="scrollbar-thin overflow-auto border-t border-stone-200 bg-stone-950 p-3 font-mono text-xs leading-5 text-stone-200">
                        {terminalOutput || 'Terminal output'}
                    </pre>
                </div>
            </section>

            {error && (
                <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-red-700 px-4 py-2 text-sm text-white shadow-lg">
                    {error}
                </div>
            )}

            {isCollaboratorModalOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                        <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
                            <h2 className="text-sm font-semibold text-stone-950">Select Users</h2>
                            <button onClick={() => setIsCollaboratorModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-stone-100" title="Close">
                                <X size={18} />
                            </button>
                        </header>
                        <div className="scrollbar-thin max-h-80 overflow-auto p-3">
                            {users.map(nextUser => (
                                <button
                                    key={nextUser._id}
                                    onClick={() => toggleSelectedUser(nextUser._id)}
                                    className={`mb-2 block w-full rounded-md border px-3 py-2 text-left text-sm ${selectedUserIds.has(nextUser._id) ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'}`}
                                >
                                    {nextUser.email}
                                </button>
                            ))}
                        </div>
                        <footer className="flex justify-end gap-2 border-t border-stone-200 p-3">
                            <button
                                onClick={() => setIsCollaboratorModalOpen(false)}
                                className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCollaborators}
                                disabled={selectedUserIds.size === 0}
                                className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                            >
                                Add
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </main>
    );
}
