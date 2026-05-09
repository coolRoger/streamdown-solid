import type { Component } from "solid-js";
import { StreamdownSolidJS } from "src";
import "src/styles.css";
import styles from "./App.module.css";
import logo from "./logo.svg";

const App: Component = () => {
    return (
        <div class={styles.App}>
            <header class={styles.header}>
                <h1>
                    <StreamdownSolidJS>
                        {
                            "# Streamdown SolidJs \n## h2 Heading \n### h3 Heading \n#### h4 Heading \n##### h5 Heading \n###### h6 Heading \nAlternatively, for H1 and H2, an underline-ish style: \nAlt-H1 \n====== \nAlt-H2 \n------ \n"
                        }
                    </StreamdownSolidJS>
                </h1>
            </header>
        </div>
    );
};

export default App;
