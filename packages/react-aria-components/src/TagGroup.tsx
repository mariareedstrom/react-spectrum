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

import {AriaTagGroupProps, useFocusRing, useHover, useTag, useTagGroup} from 'react-aria';
import {BaseCollection, CollectionProps, Document, ItemProps, ItemRenderProps, useCachedChildren, useCollectionDocument, useCollectionPortal, useSSRCollectionNode} from './Collection';
import {ButtonContext} from './Button';
import {ContextValue, DOMProps, forwardRefType, Provider, RenderProps, SlotProps, StyleRenderProps, useContextProps, useRenderProps, useSlot} from './utils';
import {filterDOMProps, mergeProps, mergeRefs, useObjectRef} from '@react-aria/utils';
import {LabelContext} from './Label';
import {ListState, Node, useListState} from 'react-stately';
import React, {createContext, ForwardedRef, forwardRef, HTMLAttributes, Key, ReactNode, RefObject, useContext, useEffect, useRef} from 'react';
import {TextContext} from './Text';

export interface TagGroupProps extends Omit<AriaTagGroupProps<unknown>, 'children' | 'items' | 'label' | 'description' | 'errorMessage' | 'keyboardDelegate'>, DOMProps, SlotProps {}

export interface TagListRenderProps {
  /**
   * Whether the tag list has no items and should display its empty state.
   * @selector [data-empty]
   */
  isEmpty: boolean,
  /**
   * Whether the tag list is currently focused.
   * @selector [data-focused]
   */
  isFocused: boolean,
  /**
   * Whether the tag list is currently keyboard focused.
   * @selector [data-focus-visible]
   */
  isFocusVisible: boolean
}

export interface TagListProps<T> extends Omit<CollectionProps<T>, 'disabledKeys'>, StyleRenderProps<TagListRenderProps> {
  /** Provides content to display when there are no items in the tag list. */
  renderEmptyState?: () => ReactNode
}

interface InternalTagGroupContextValue {
  state: ListState<any>,
  document: Document<any, BaseCollection<any>>,
  gridProps: HTMLAttributes<HTMLElement>,
  tagListRef: RefObject<HTMLDivElement>
}

export const TagGroupContext = createContext<ContextValue<TagGroupProps, HTMLDivElement>>(null);
const InternalTagGroupContext = createContext<InternalTagGroupContextValue | null>(null);

function TagGroup(props: TagGroupProps, ref: ForwardedRef<HTMLDivElement>) {
  [props, ref] = useContextProps(props, ref, TagGroupContext);
  let tagListRef = useRef<HTMLDivElement>(null);
  let [labelRef, label] = useSlot();
  let {collection, document} = useCollectionDocument();
  let state = useListState({
    ...props,
    children: undefined,
    collection
  });

  // Prevent DOM props from going to two places.
  let domProps = filterDOMProps(props);
  let domPropOverrides = Object.fromEntries(Object.entries(domProps).map(([k]) => [k, undefined]));
  let {
    gridProps,
    labelProps,
    descriptionProps,
    errorMessageProps
  } = useTagGroup({
    ...props,
    ...domPropOverrides,
    label
  }, state, tagListRef);

  return (
    <div
      {...domProps}
      ref={ref}
      slot={props.slot}
      className={props.className ?? 'react-aria-TagGroup'}
      style={props.style}>
      <Provider
        values={[
          [LabelContext, {...labelProps, elementType: 'span', ref: labelRef}],
          [InternalTagGroupContext, {state, document, gridProps, tagListRef}],
          [TextContext, {
            slots: {
              description: descriptionProps,
              errorMessage: errorMessageProps
            }
          }]
        ]}>
        {props.children}
      </Provider>
    </div>
  );
}

/**
 * A tag group is a focusable list of labels, categories, keywords, filters, or other items, with support for keyboard navigation, selection, and removal.
 */
const _TagGroup = /*#__PURE__*/ (forwardRef as forwardRefType)(TagGroup);
export {_TagGroup as TagGroup};

function TagList<T extends object>(props: TagListProps<T>, forwardedRef: ForwardedRef<HTMLDivElement>) {
  // Render the portal first so that we have the collection by the time we render the DOM in SSR.
  let {document} = useContext(InternalTagGroupContext)!;
  let portal = useCollectionPortal(props, document);
  return (
    <>
      {portal}
      <TagListInner props={props} forwardedRef={forwardedRef} />
    </>
  );
}

interface TagListInnerProps<T> {
  props: TagListProps<T>,
  forwardedRef: ForwardedRef<HTMLDivElement>
}

function TagListInner<T extends object>({props, forwardedRef}: TagListInnerProps<T>) {
  let {state, gridProps, tagListRef} = useContext(InternalTagGroupContext)!;
  let ref = mergeRefs(tagListRef, forwardedRef);

  let children = useCachedChildren({
    items: state.collection,
    children: (item: Node<T>) => {
      switch (item.type) {
        case 'item':
          return <TagItem item={item} />;
        default:
          throw new Error('Unsupported node type in TagList: ' + item.type);
      }
    }
  });

  let {focusProps, isFocused, isFocusVisible} = useFocusRing();
  let renderProps = useRenderProps({
    className: props.className,
    style: props.style,
    defaultClassName: 'react-aria-TagList',
    values: {
      isEmpty: state.collection.size === 0,
      isFocused,
      isFocusVisible
    }
  });

  return (
    <div
      {...mergeProps(gridProps, focusProps)}
      {...renderProps}
      {...filterDOMProps(props as any)}
      ref={ref}
      data-empty={state.collection.size === 0 || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}>
      {state.collection.size === 0 && props.renderEmptyState ? props.renderEmptyState() : children}
    </div>
  );
}

/**
 * A tag list is a container for tags within a TagGroup.
 */
const _TagList = /*#__PURE__*/ (forwardRef as forwardRefType)(TagList);
export {_TagList as TagList};

export interface TagRenderProps extends Omit<ItemRenderProps, 'allowsDragging' | 'isDragging' | 'isDropTarget'> {
  /**
   * Whether the tag group allows items to be removed.
   * @selector [data-allows-removing]
   */
  allowsRemoving: boolean
}

export interface TagProps extends RenderProps<TagRenderProps> {
  /** A unique id for the tag. */
  id?: Key,
  /**
   * A string representation of the tags's contents, used for accessibility.
   * Required if children is not a plain text string.
   */
  textValue?: string
}

function Tag(props: TagProps, ref: ForwardedRef<HTMLDivElement>): JSX.Element | null {
  return useSSRCollectionNode('item', props, ref, props.children);
}

/**
 * A Tag is an individual item within a TagList.
 */
const _Tag = /*#__PURE__*/ (forwardRef as forwardRefType)(Tag);
export {_Tag as Tag};

function TagItem({item}) {
  let {state} = useContext(InternalTagGroupContext)!;
  let ref = useObjectRef<HTMLDivElement>(item.props.ref);
  let {focusProps, isFocusVisible} = useFocusRing({within: true});
  let {rowProps, gridCellProps, removeButtonProps, ...states} = useTag({item}, state, ref);

  let {hoverProps, isHovered} = useHover({
    isDisabled: !states.allowsSelection
  });

  let props: ItemProps<unknown> = item.props;
  let renderProps = useRenderProps({
    ...props,
    id: undefined,
    children: item.rendered,
    defaultClassName: 'react-aria-Tag',
    values: {
      ...states,
      isFocusVisible,
      isHovered,
      selectionMode: state.selectionManager.selectionMode,
      selectionBehavior: state.selectionManager.selectionBehavior
    }
  });

  useEffect(() => {
    if (!item.textValue) {
      console.warn('A `textValue` prop is required for <Tag> elements with non-plain text children for accessibility.');
    }
  }, [item.textValue]);

  return (
    <div
      ref={ref}
      {...renderProps}
      {...mergeProps(filterDOMProps(props as any), rowProps, focusProps, hoverProps)}
      data-selected={states.isSelected || undefined}
      data-disabled={states.isDisabled || undefined}
      data-hovered={isHovered || undefined}
      data-focused={states.isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-pressed={states.isPressed || undefined}
      data-allows-removing={states.allowsRemoving || undefined}
      data-selection-mode={state.selectionManager.selectionMode === 'none' ? undefined : state.selectionManager.selectionMode}>
      <div {...gridCellProps}>
        <Provider
          values={[
            [ButtonContext, {
              slots: {
                remove: removeButtonProps
              }
            }]
          ]}>
          {renderProps.children}
        </Provider>
      </div>
    </div>
  );
}
