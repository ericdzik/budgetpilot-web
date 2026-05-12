/**
 * FloatInput — Input avec placeholder flottant et astérisque rouge
 *
 * Simule le comportement Flutter InputDecoration avec RichText label.
 * Le placeholder est visible quand le champ est vide et non focalisé.
 * Le * est toujours rouge.
 */
import { useState } from 'react'

const BG_WHITE = '#ffffff'

export default function FloatInput({
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,      // texte sans *
  required = false, // affiche le * rouge
  style = {},
  inputRef,
  ...rest
}) {
  const [focused, setFocused] = useState(false)

  const showPlaceholder = !focused && !value

  const baseInputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    backgroundColor: BG_WHITE,
    fontSize: '14px',
    color: '#111',
    outline: 'none',
    boxSizing: 'border-box',
    // Rendre le placeholder natif invisible — on gère le nôtre
    ...style,
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        placeholder="" // placeholder natif vide
        onFocus={(e) => { setFocused(true); onFocus?.(e) }}
        onBlur={(e)  => { setFocused(false); onBlur?.(e) }}
        style={baseInputStyle}
        {...rest}
      />
      {/* Placeholder custom avec * rouge — visible seulement si vide et non focalisé */}
      {showPlaceholder && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '14px',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: '14px',
            color: '#aaa',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            maxWidth: 'calc(100% - 28px)',
          }}
        >
          {placeholder}
          {required && (
            <span style={{ color: '#e53935', marginLeft: '2px' }}>*</span>
          )}
        </div>
      )}
    </div>
  )
}
