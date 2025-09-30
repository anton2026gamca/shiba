export default function ShippingInput({ label, placeholder, defaultValue, style = {}, type = "text", required = true, onChange }) {
  const handlePhoneChange = (e) => {
    if (type === "tel") {
      let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
      
      // If it starts with 1 and has more than 1 digit, assume it's US (+1)
      if (value.startsWith('1') && value.length > 1) {
        value = '+' + value;
      } else if (value.length > 0 && !value.startsWith('+')) {
        // For other countries, add + if not present
        value = '+' + value;
      }
      
      e.target.value = value;
    }
  };

  const getMinLength = () => {
    if (type === "tel") {
      return 10; // Minimum 10 digits for a valid phone number (including country code)
    }
    return undefined;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", ...style }}>
      <label style={{
        fontSize: "11px",
        fontWeight: "500",
        color: "rgba(0,0,0,0.7)",
        marginBottom: "2px",
      }}>
        {label}{required && <span style={{ color: "#ff0000", marginLeft: "2px" }}>*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        minLength={getMinLength()}
        onChange={(e) => {
          if (type === "tel") {
            handlePhoneChange(e);
          }
          if (onChange) {
            onChange(e);
          }
        }}
        style={{
          padding: "6px",
          borderRadius: "4px",
          border: "1px solid rgba(0,0,0,0.18)",
          background: "rgba(255,255,255,0.8)",
          outline: "none",
          fontSize: "11px",
        }}
      />
    </div>
  );
}
