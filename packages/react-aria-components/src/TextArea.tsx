import {ContextValue, StyleRenderProps, useContextProps, useRenderProps} from './utils';
import {InputRenderProps} from './Input';
import {mergeProps, useFocusRing, useHover} from 'react-aria';
import React, {createContext, ForwardedRef, forwardRef, TextareaHTMLAttributes} from 'react';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'style'>, StyleRenderProps<InputRenderProps> {}

export const TextAreaContext = createContext<ContextValue<TextAreaProps, HTMLTextAreaElement>>({});

function TextArea(props: TextAreaProps, ref: ForwardedRef<HTMLTextAreaElement>) {
  [props, ref] = useContextProps(props, ref, TextAreaContext);

  let {hoverProps, isHovered} = useHover({});
  let {isFocused, isFocusVisible, focusProps} = useFocusRing({
    isTextInput: true,
    autoFocus: props.autoFocus
  });

  let isInvalid = !!props['aria-invalid'] && props['aria-invalid'] !== 'false';
  let renderProps = useRenderProps({
    ...props,
    values: {
      isHovered,
      isFocused,
      isFocusVisible,
      isDisabled: props.disabled || false,
      isInvalid
    },
    defaultClassName: 'react-aria-TextArea'
  });

  return (
    <textarea
      {...mergeProps(props, focusProps, hoverProps)}
      {...renderProps}
      ref={ref}
      data-focused={isFocused || undefined}
      data-disabled={props.disabled || undefined}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-invalid={isInvalid || undefined} />
  );
}
/**
 * A textarea allows a user to input mult-line text.
 */
const _TextArea = forwardRef(TextArea);
export {_TextArea as TextArea};
