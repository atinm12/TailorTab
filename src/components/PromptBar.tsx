import { useState, type FormEvent } from "react";

interface Props {
  parsing: boolean;
  onPrompt: (prompt: string) => void;
}

export function PromptBar({ parsing, onPrompt }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const prompt = value.trim();
    if (!prompt || parsing) return;
    onPrompt(prompt);
    setValue("");
  }

  return (
    <form className="prompt-bar" onSubmit={handleSubmit}>
      <span className="prompt-icon" aria-hidden>
        ✦
      </span>
      <input
        className="prompt-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Add a widget… e.g. "show me Steelers news" or "TSLA stock price"'
        autoFocus
        disabled={parsing}
      />
      <button className="prompt-submit" type="submit" disabled={parsing || !value.trim()}>
        {parsing ? <span className="spinner" aria-label="Thinking" /> : "Add"}
      </button>
    </form>
  );
}
