import React from "react";

interface ChatPanelProps {
  sz: (n: number) => number;
  messages: Array<{ role: string; text: string }>;
  typingText?: string;
  showTypingIndicator?: boolean;
  inputText?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  sz,
  messages,
  showTypingIndicator = false,
  inputText = "",
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        borderRadius: sz(8),
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${sz(10)}px ${sz(14)}px`,
          backgroundColor: "#6366f1",
          color: "#fff",
          fontSize: sz(14),
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: sz(8),
        }}
      >
        <span style={{ fontSize: sz(16) }}>🤖</span>
        <span>AI Assistant</span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: sz(12),
          display: "flex",
          flexDirection: "column",
          gap: sz(10),
          overflow: "hidden",
        }}
      >
        {messages.map((msg, i) => {
          const isAi = msg.role === "ai";
          return (
            <div
              key={i}
              style={{
                alignSelf: isAi ? "flex-start" : "flex-end",
                maxWidth: "85%",
                backgroundColor: isAi ? "#eef2ff" : "#6366f1",
                color: isAi ? "#111827" : "#fff",
                borderRadius: sz(12),
                padding: `${sz(8)}px ${sz(12)}px`,
                fontSize: sz(12),
                lineHeight: 1.4,
                borderBottomLeftRadius: isAi ? sz(4) : sz(12),
                borderBottomRightRadius: isAi ? sz(12) : sz(4),
              }}
            >
              {msg.text}
            </div>
          );
        })}

        {/* Typing indicator */}
        {showTypingIndicator && (
          <div
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#eef2ff",
              borderRadius: sz(12),
              borderBottomLeftRadius: sz(4),
              padding: `${sz(8)}px ${sz(14)}px`,
              display: "flex",
              gap: sz(4),
              alignItems: "center",
            }}
          >
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                style={{
                  width: sz(6),
                  height: sz(6),
                  borderRadius: "50%",
                  backgroundColor: "#9ca3af",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: `${sz(8)}px ${sz(12)}px`,
          display: "flex",
          alignItems: "center",
          gap: sz(8),
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: "#f3f4f6",
            borderRadius: sz(8),
            padding: `${sz(8)}px ${sz(10)}px`,
            fontSize: sz(12),
            color: inputText ? "#111827" : "#9ca3af",
            minHeight: sz(20),
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {inputText || "Type a message..."}
        </div>
        <div
          style={{
            width: sz(28),
            height: sz(28),
            borderRadius: "50%",
            backgroundColor: inputText ? "#6366f1" : "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: sz(12),
            color: "#fff",
          }}
        >
          ➤
        </div>
      </div>
    </div>
  );
};
