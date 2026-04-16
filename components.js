// Shared components
const Card = _ref => {
  let {
    children,
    style,
    onClick
  } = _ref;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      background: '#fff',
      borderRadius: 13,
      padding: 14,
      marginBottom: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      lineHeight: 1.8,
      ...style
    }
  }, children);
};
const Btn = _ref2 => {
  let {
    children,
    onClick,
    color = '#10b981',
    full,
    small,
    disabled,
    style
  } = _ref2;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    disabled: disabled,
    style: {
      padding: small ? '6px 12px' : '12px 16px',
      borderRadius: small ? 8 : 12,
      border: 'none',
      background: disabled ? '#ccc' : `linear-gradient(135deg,${color},${color}dd)`,
      color: '#fff',
      fontSize: small ? 11 : 14,
      fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: ST.f,
      width: full ? '100%' : undefined,
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, children);
};
const Inp = _ref3 => {
  let {
    value,
    onChange,
    placeholder,
    type = 'text',
    style
  } = _ref3;
  return /*#__PURE__*/React.createElement("input", {
    type: type,
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    style: {
      width: '100%',
      padding: 8,
      borderRadius: 8,
      border: '1px solid #d5d0c5',
      fontSize: 12,
      fontFamily: 'inherit',
      direction: 'rtl',
      outline: 'none',
      background: '#faf8f3',
      ...style
    }
  });
};
const Sel = _ref4 => {
  let {
    value,
    onChange,
    children,
    style
  } = _ref4;
  return /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange(e.target.value),
    style: {
      width: '100%',
      padding: 8,
      borderRadius: 8,
      border: '1px solid #d5d0c5',
      fontSize: 12,
      fontFamily: 'inherit',
      direction: 'rtl',
      outline: 'none',
      background: '#faf8f3',
      ...style
    }
  }, children);
};
const Bk = _ref5 => {
  let {
    onClick
  } = _ref5;
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      background: 'none',
      border: 'none',
      fontSize: 12,
      color: ST.mt,
      cursor: 'pointer',
      fontFamily: 'inherit'
    }
  }, "\u2190 \u0648\u0627\u067E\u0633");
};
const Bdg = _ref6 => {
  let {
    text,
    bg,
    color
  } = _ref6;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      background: bg || '#f0ebe0',
      color: color || '#6b7c6b',
      padding: '3px 8px',
      borderRadius: 5,
      fontSize: 10,
      fontWeight: 700,
      lineHeight: 1.8
    }
  }, text);
};
const Ttl = _ref7 => {
  let {
    icon,
    text
  } = _ref7;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      marginBottom: 10,
      lineHeight: 2
    }
  }, icon, " ", text);
};
const Row = _ref8 => {
  let {
    label,
    children
  } = _ref8;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: '#999',
      marginBottom: 2
    }
  }, label), children);
};

