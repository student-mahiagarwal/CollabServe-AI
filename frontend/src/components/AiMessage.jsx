import Markdown from 'markdown-to-jsx';
import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import { CircleAlert } from 'lucide-react';
import { parseAiMessage } from '../lib/aiMessage.js';

function CodeBlock(props) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            hljs.highlightElement(ref.current);
        }
    }, [ props.children ]);

    return <code {...props} ref={ref} />;
}

export default function AiMessage({ message }) {
    const parsed = parseAiMessage(message);

    if (parsed.type === 'error') {
        return (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                <CircleAlert size={16} className="mt-0.5 shrink-0 text-red-600" />
                <p className="text-sm leading-6">{parsed.text}</p>
            </div>
        );
    }

    return (
        <div className="prose prose-sm max-w-none prose-pre:bg-stone-950 prose-pre:text-stone-50">
            <Markdown options={{ overrides: { code: CodeBlock } }}>
                {parsed.text}
            </Markdown>
        </div>
    );
}
