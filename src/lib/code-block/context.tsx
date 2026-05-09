import { createContext, useContext } from "solid-js";

interface CodeBlockContextType {
    code: string;
}

export const CodeBlockContext = createContext<CodeBlockContextType>({
    code: "",
});

export const useCodeBlockContext = () => useContext(CodeBlockContext);
