import React from "react";
import {
  ScrollView,
  ScrollViewProps,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

type Props = ScrollViewProps & {
  children?: React.ReactNode;
};

export const KeyboardAwareScrollViewCompat = React.forwardRef<
  ScrollView,
  Props
>(
  (
    {
      children,
      keyboardShouldPersistTaps = "handled",
      style,
      contentContainerStyle,
      ...props
    },
    ref,
  ) => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={ref}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          style={style}
          contentContainerStyle={contentContainerStyle}
          {...props}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  },
);

KeyboardAwareScrollViewCompat.displayName = "KeyboardAwareScrollViewCompat";
