import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, TextInput } from 'react-native';

/**
 * ScrollView que se corre solo para que el campo que estás escribiendo
 * quede SIEMPRE arriba del teclado (Android e iOS).
 * Los <Input> de la app avisan cuando reciben foco a través del contexto.
 */
const KeyboardScrollContext = createContext({ reveal: () => {} });
export const useKeyboardScroll = () => useContext(KeyboardScrollContext);

export default function KeyboardAwareScroll({ children, contentContainerStyle, extraSpace = 28, onScroll, ...props }) {
  const scrollRef = useRef(null);
  const offsetY = useRef(0);
  const keyboardTop = useRef(null); // posición Y de la parte de arriba del teclado
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const reveal = useCallback(() => {
    // esperamos un toque a que el layout se acomode
    setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput?.();
      if (!input || typeof input.measureInWindow !== 'function' || keyboardTop.current == null) return;
      input.measureInWindow((_x, y, _w, h) => {
        const overflow = y + h + extraSpace - keyboardTop.current;
        if (overflow > 0) {
          scrollRef.current?.scrollTo({ y: offsetY.current + overflow, animated: true });
        }
      });
    }, 80);
  }, [extraSpace]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      keyboardTop.current = e.endCoordinates.screenY;
      setKeyboardHeight(e.endCoordinates.height);
      reveal();
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = null;
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [reveal]);

  return (
    <KeyboardScrollContext.Provider value={{ reveal }}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => {
          offsetY.current = e.nativeEvent.contentOffset.y;
          onScroll?.(e);
        }}
        {...props}
        contentContainerStyle={[contentContainerStyle, keyboardHeight ? { paddingBottom: keyboardHeight + extraSpace } : null]}
      >
        {children}
      </ScrollView>
    </KeyboardScrollContext.Provider>
  );
}
