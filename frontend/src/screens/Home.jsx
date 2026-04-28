import { LogOut, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios.js';
import { useUser } from '../context/UserContext.jsx';

export default function Home() {
    const [projects, setProjects] = useState([]);
    const [projectName, setProjectName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const { user, setUser } = useUser();
    const navigate = useNavigate();

    async function loadProjects() {
        const res = await axios.get('/projects/all');
        setProjects(res.data.projects);
    }

    useEffect(() => {
        loadProjects().catch(err => setError(err.response?.data?.error || 'Could not load projects'));
    }, []);

    async function createProject(event) {
        event.preventDefault();
        setError('');

        try {
            const res = await axios.post('/projects/create', { name: projectName });
            setProjects(prev => [res.data.project, ...prev]);
            setProjectName('');
            setIsModalOpen(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not create project');
        }
    }

    async function logout() {
        try {
            await axios.get('/users/logout');
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            navigate('/login');
        }
    }

    return (
        <main className="min-h-screen bg-[#020617] text-white relative overflow-hidden">

            {/* 🌌 BACKGROUND GLOW */}
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 blur-3xl rounded-full"></div>

            {/* 🔳 GRID */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(#00ffcc22_1px,transparent_1px),linear-gradient(90deg,#00ffcc22_1px,transparent_1px)] bg-[size:40px_40px] animate-grid"></div>

            {/* 🔍 SCANLINE */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-[2px] bg-emerald-400/30 animate-scanline"></div>
            </div>

            {/* 🔥 HEADER */}
            <header className="border-b border-white/10 bg-white/5 backdrop-blur relative z-10">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

                    <div>
                        <h1 className="text-2xl font-semibold tracking-wide">Projects</h1>
                        <p className="text-sm text-gray-400">{user?.email}</p>
                    </div>

                    <button
                        onClick={logout}
                        className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 transition"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>

                </div>
            </header>

            {/* 🔥 MAIN */}
            <section className="mx-auto max-w-7xl px-6 py-8 relative z-10">

                {/* 🔥 TOP BAR */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

                    <div className="flex items-center gap-6 text-sm text-gray-400">
                        <span>{projects.length} projects</span>
                        <span>•</span>
                        <span>Realtime collaboration</span>
                    </div>

                    <div className="flex items-center gap-3">

                        <input
                            placeholder="Search projects..."
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder-gray-500 focus:border-emerald-400 transition"
                        />

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-black font-medium hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] transition"
                        >
                            <Plus size={16} />
                            New Project
                        </button>

                    </div>
                </div>

                {/* 🔥 ERROR */}
                {error && (
                    <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
                        {error}
                    </p>
                )}

                {/* 🔥 EMPTY STATE */}
                {projects.length === 0 ? (
                    <div className="mt-24 text-center text-gray-500">
                        <p className="text-lg">No projects yet 🚀</p>
                        <p className="text-sm">Create your first project to begin</p>
                    </div>
                ) : (

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                        {projects.map(project => (
                            <div
                                key={project._id}
                                onClick={() => navigate(`/project/${project._id}`)}
                                className="group relative cursor-pointer rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                            >

                                {/* glow effect */}
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition bg-emerald-500/10 blur-xl"></div>

                                <div className="relative z-10">

                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-black font-bold">
                                            {project.name[0].toUpperCase()}
                                        </div>

                                        <h2 className="text-lg font-medium">
                                            {project.name}
                                        </h2>
                                    </div>

                                    <p className="mb-4 text-sm text-gray-400">
                                        Collaborative coding workspace
                                    </p>

                                    <div className="flex items-center justify-between text-sm text-gray-400">

                                        <div className="flex items-center gap-2">
                                            <Users size={15} />
                                            {project.users.length} collaborator{project.users.length === 1 ? '' : 's'}
                                        </div>

                                        <span className="opacity-0 transition group-hover:opacity-100 text-emerald-400">
                                            Open →
                                        </span>

                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>
                )}

            </section>

            {/* 🔥 MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                    <form
                        onSubmit={createProject}
                        className="w-full max-w-md rounded-xl border border-white/10 bg-[#020617] p-6 shadow-2xl"
                    >
                        <h2 className="mb-4 text-lg font-semibold">
                            Create New Project
                        </h2>

                        <input
                            value={projectName}
                            onChange={e => setProjectName(e.target.value)}
                            placeholder="Project name..."
                            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-400"
                            autoFocus
                            required
                        />

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-md border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="rounded-md bg-emerald-500 px-4 py-2 text-sm text-black font-medium hover:bg-emerald-400"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 🔥 ANIMATIONS */}
            <style>{`
                @keyframes gridMove {
                  0% { transform: translate(0,0); }
                  100% { transform: translate(40px,40px); }
                }
                .animate-grid {
                  animation: gridMove 15s linear infinite;
                }

                @keyframes scanline {
                  0% { transform: translateY(-100%); }
                  100% { transform: translateY(100vh); }
                }
                .animate-scanline {
                  animation: scanline 8s linear infinite;
                }
            `}</style>

        </main>
    );
}