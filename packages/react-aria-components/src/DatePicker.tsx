/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {AriaDatePickerProps, AriaDateRangePickerProps, DateValue, useDateField, useDatePicker, useDateRangePicker, useFocusRing, useLocale} from 'react-aria';
import {ButtonContext} from './Button';
import {CalendarContext, RangeCalendarContext} from './Calendar';
import {ContextValue, forwardRefType, Provider, RenderProps, SlotProps, useContextProps, useRenderProps, useSlot} from './utils';
import {createCalendar} from '@internationalized/date';
import {DateInputContext} from './DateField';
import {DatePickerState, DateRangePickerState, useDateFieldState, useDatePickerState, useDateRangePickerState} from 'react-stately';
import {DialogContext} from './Dialog';
import {filterDOMProps} from '@react-aria/utils';
import {GroupContext} from './Group';
import {LabelContext} from './Label';
import {PopoverContext} from './Popover';
import React, {createContext, ForwardedRef, forwardRef, useRef} from 'react';
import {TextContext} from './Text';

export interface DatePickerRenderProps {
  /**
   * Whether an element within the date picker is focused, either via a mouse or keyboard.
   * @selector [data-focus-within]
   */
  isFocusWithin: boolean,
  /**
   * Whether an element within the date picker is keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean,
  /**
   * Whether the date picker is disabled.
   * @selector [data-disabled]
   */
  isDisabled: boolean,
  /**
   * Whether the date picker is invalid.
   * @selector [data-disabled]
   */
  isInvalid: boolean,
  /**
   * State of the date picker.
   */
  state: DatePickerState
}
export interface DateRangePickerRenderProps extends Omit<DatePickerRenderProps, 'state'> {
  /**
   * State of the date range picker.
   */
  state: DateRangePickerState
}

export interface DatePickerProps<T extends DateValue> extends Omit<AriaDatePickerProps<T>, 'label' | 'description' | 'errorMessage' | 'validationState'>, RenderProps<DatePickerRenderProps>, SlotProps {}
export interface DateRangePickerProps<T extends DateValue> extends Omit<AriaDateRangePickerProps<T>, 'label' | 'description' | 'errorMessage' | 'validationState'>, RenderProps<DateRangePickerRenderProps>, SlotProps {}

export const DatePickerContext = createContext<ContextValue<DatePickerProps<any>, HTMLDivElement>>(null);
export const DateRangePickerContext = createContext<ContextValue<DateRangePickerProps<any>, HTMLDivElement>>(null);

function DatePicker<T extends DateValue>(props: DatePickerProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, DatePickerContext);
  let state = useDatePickerState(props);
  let groupRef = useRef<HTMLDivElement>(null);
  let [labelRef, label] = useSlot();
  let {
    groupProps,
    labelProps,
    fieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
    descriptionProps,
    errorMessageProps
  } = useDatePicker({...props, label}, state, groupRef);

  let {locale} = useLocale();
  let fieldState = useDateFieldState({
    ...fieldProps,
    locale,
    createCalendar
  });

  let fieldRef = useRef<HTMLDivElement>(null);
  let inputRef = useRef<HTMLInputElement>(null);
  let {focusProps, isFocused, isFocusVisible} = useFocusRing({within: true});
  let {fieldProps: dateFieldProps, inputProps} = useDateField({...fieldProps, label, inputRef}, fieldState, fieldRef);

  let renderProps = useRenderProps({
    ...props,
    values: {
      state,
      isFocusWithin: isFocused,
      isFocusVisible,
      isDisabled: props.isDisabled || false,
      isInvalid: state.isInvalid
    },
    defaultClassName: 'react-aria-DatePicker'
  });

  let DOMProps = filterDOMProps(props);
  delete DOMProps.id;

  return (
    <Provider
      values={[
        [GroupContext, {...groupProps, ref: groupRef}],
        [DateInputContext, {state: fieldState, fieldProps: dateFieldProps, ref: fieldRef, inputProps, inputRef}],
        [ButtonContext, {...buttonProps, isPressed: state.isOpen}],
        [LabelContext, {...labelProps, ref: labelRef, elementType: 'span'}],
        [CalendarContext, calendarProps],
        [PopoverContext, {state, triggerRef: groupRef, placement: 'bottom start'}],
        [DialogContext, dialogProps],
        [TextContext, {
          slots: {
            description: descriptionProps,
            errorMessage: errorMessageProps
          }
        }]
      ]}>
      <div
        {...focusProps}
        {...DOMProps}
        {...renderProps}
        ref={ref}
        slot={props.slot}
        data-focus-within={isFocused || undefined}
        data-invalid={state.isInvalid || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-disabled={props.isDisabled || undefined} />
    </Provider>
  );
}

/**
 * A date picker combines a DateField and a Calendar popover to allow users to enter or select a date and time value.
 */
const _DatePicker = /*#__PURE__*/ (forwardRef as forwardRefType)(DatePicker);
export {_DatePicker as DatePicker};

function DateRangePicker<T extends DateValue>(props: DateRangePickerProps<T>, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, DateRangePickerContext);
  let state = useDateRangePickerState(props);
  let groupRef = useRef<HTMLDivElement>(null);
  let [labelRef, label] = useSlot();
  let {
    groupProps,
    labelProps,
    startFieldProps,
    endFieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
    descriptionProps,
    errorMessageProps
  } = useDateRangePicker({...props, label}, state, groupRef);

  let {locale} = useLocale();
  let startFieldState = useDateFieldState({
    ...startFieldProps,
    locale,
    createCalendar
  });

  let startFieldRef = useRef<HTMLDivElement>(null);
  let startInputRef = useRef<HTMLInputElement>(null);
  let {focusProps, isFocused, isFocusVisible} = useFocusRing({within: true});
  let {fieldProps: startDateFieldProps, inputProps: startInputProps} = useDateField({...startFieldProps, label, inputRef: startInputRef}, startFieldState, startFieldRef);

  let endFieldState = useDateFieldState({
    ...endFieldProps,
    locale,
    createCalendar
  });

  let endFieldRef = useRef<HTMLDivElement>(null);
  let endInputRef = useRef<HTMLInputElement>(null);
  let {fieldProps: endDateFieldProps, inputProps: endInputProps} = useDateField({...endFieldProps, label, inputRef: endInputRef}, endFieldState, endFieldRef);

  let renderProps = useRenderProps({
    ...props,
    values: {
      state,
      isFocusWithin: isFocused,
      isFocusVisible,
      isDisabled: props.isDisabled || false,
      isInvalid: state.isInvalid
    },
    defaultClassName: 'react-aria-DateRangePicker'
  });

  let DOMProps = filterDOMProps(props);
  delete DOMProps.id;

  return (
    <Provider
      values={[
        [GroupContext, {...groupProps, ref: groupRef}],
        [ButtonContext, {...buttonProps, isPressed: state.isOpen}],
        [LabelContext, {...labelProps, ref: labelRef, elementType: 'span'}],
        [RangeCalendarContext, calendarProps],
        [PopoverContext, {state, triggerRef: groupRef, placement: 'bottom start'}],
        [DialogContext, dialogProps],
        [DateInputContext, {
          slots: {
            start: {
              state: startFieldState,
              fieldProps: startDateFieldProps,
              ref: startFieldRef,
              inputRef: startInputRef,
              inputProps: startInputProps
            },
            end: {
              state: endFieldState,
              fieldProps: endDateFieldProps,
              ref: endFieldRef,
              inputRef: endInputRef,
              inputProps: endInputProps
            }
          }
        }],
        [TextContext, {
          slots: {
            description: descriptionProps,
            errorMessage: errorMessageProps
          }
        }]
      ]}>
      <div
        {...focusProps}
        {...DOMProps}
        {...renderProps}
        ref={ref}
        slot={props.slot}
        data-focus-within={isFocused || undefined}
        data-invalid={state.isInvalid || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-disabled={props.isDisabled || undefined} />
    </Provider>
  );
}

/**
 * A date range picker combines two DateFields and a RangeCalendar popover to allow
 * users to enter or select a date and time range.
 */
const _DateRangePicker = /*#__PURE__*/ (forwardRef as forwardRefType)(DateRangePicker);
export {_DateRangePicker as DateRangePicker};
