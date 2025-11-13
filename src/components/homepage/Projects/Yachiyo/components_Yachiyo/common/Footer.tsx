export default function FooterLayout() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "75px",
        width: "100%",
        backgroundColor: "#fff",
        // borderTop: "1px solid #e0e0e0",
        padding: "6px 0",
        fontSize: "12px",
        color: "#555555",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "35px",
        //zIndex: 1000,
      }}
    >
      <div style={{ color: "grey" }}>version v1.00.34</div>
      <div style={{ color: "#555555" }}>
        Generative AI can make mistakes. Please double-check responses.
      </div>
      <div>
        a{" "}
        <span style={{ color: "#da2128", fontWeight: 500 }}>
          Motherson Intelligence
        </span>{" "}
        initiative
      </div>
    </div>
  );
}