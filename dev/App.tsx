import { useChat } from "@kodehort/ai-sdk-solid";
import { DefaultChatTransport } from "ai";
import { type Component, createSignal, For } from "solid-js";
import { StreamdownSolid } from "src";
import styles from "./App.module.css";

const App: Component = () => {
    const { messages, sendMessage } = useChat({
        transport: new DefaultChatTransport({
            api: "http://localhost:3000/api/ai/chat/test",
        }),
    });

    const [input, setInput] = createSignal("");

    return (
        <div
            style={{
                padding: "20px",
                width: "100vw",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                display: "flex",
                "flex-direction": "column",
            }}
        >
            <div
                style={{
                    flex: 1,
                    height: 0,
                    overflow: "hidden",
                    "overflow-x": "hidden",
                    "overflow-y": "auto",
                }}
            >
                <For each={messages}>
                    {(message) => (
                        <div>
                            <p>{message.role}:</p>
                            <For each={message.parts}>
                                {(part) => {
                                    switch (part.type) {
                                        case "text": {
                                            return (
                                                <StreamdownSolid>
                                                    {part.text}
                                                </StreamdownSolid>
                                            );
                                        }
                                        default: {
                                            return null;
                                        }
                                    }
                                }}
                            </For>
                        </div>
                    )}
                </For>
            </div>
            <div style={{ "margin-top": "auto" }}>
                <input
                    type="text"
                    placeholder="message"
                    value={input()}
                    oninput={(e) => {
                        setInput(e.target.value);
                    }}
                />
                <button
                    type="button"
                    onClick={() =>
                        sendMessage({
                            text: input(),
                        })
                    }
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default App;
