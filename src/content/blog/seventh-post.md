---
title: 'You Know Semantic HTML. Now What? An Intro to ARIA'
description: 'Learn the vocabulary of ARIA: Roles, Properties, and States. Discover how to build accessible web components that go beyond what HTML provides.'
pubDate: 'Nov 14 2025'
heroImage: '@assets/teacher_whiteboard.png'
heroImageAlt: 'A teacher at a whiteboard explaining ARIA concepts'
---

If you're a web developer, you've had this drilled into you: **use semantic HTML**. Use `<nav>` for navigation, `<button>` for buttons, and `<main>` for your main content. It's the foundation of an accessible, professional, and SEO-friendly website.

But what happens when you need to build a component that HTML doesn't have a tag for?

What’s the tag for a `tabs` widget? A `slider`? A `combobox`? An `alert` that pops up on the page?

This is where HTML hits its limit. HTML was designed for static documents, not complex web *applications*. And this is exactly why **ARIA (Accessible Rich Internet Applications)** was created.

If semantic HTML is the strong, built-in foundation, ARIA is the set of labels and instructions you add *on top* to describe all the complex, dynamic parts. It bridges the gap between what HTML provides and what modern applications need.

But ARIA is a promise. When you use it, you're telling assistive technologies (like screen readers) that your generic `<div>` will *behave* like a real slider. This means you **must** add the necessary JavaScript to make it work.

Today, we're not building a component. We're just learning the new vocabulary. ARIA gives us three new types of tools: **Roles**, **Properties**, and **States**.

## 1. Roles: The "What"

A **Role** answers the question, "What *is* this thing?"

It’s the most important part of ARIA. You use it to tell a screen reader that your generic `<div>` or `<span>` is pretending to be a complex component.

HTML already has built-in roles. When you write `<nav>`, you're implicitly telling the browser `role="navigation"`. When you write `<button>`, you're using `role="button"`. The first rule of ARIA is: **Don't use ARIA if you can use a native HTML element.**

But when you can't, roles are your go-to.

**Examples of Roles that DON'T exist in HTML:**

  * `role="tablist"`: Declares that a `<div>` is the container for a list of tabs.
  * `role="tab"`: Declares that a link or button inside a `tablist` is a single tab.
  * `role="tabpanel"`: Declares that a `<div>` is the content panel associated with a tab.
  * `role="slider"`: Declares a `<div>` as a custom slider component.
  * `role="dialog"`: Declares a `<div>` as a modal dialog that pops up and traps focus.
  * `role="alert"`: Declares a `<div>` as a live alert. A screen reader will read its contents immediately.
  * `role="switch"`: Declares an element as a "toggle" switch (like on iOS or Android).

By adding `role="tablist"`, you're making a promise: "This `<div>` may not look like it, but it's a tab container. I will add the JavaScript to make it work like one."

## 2. Properties: The "How"

**Properties** (often just called attributes) answer the question, "How does this element *relate* to other elements?"

These are the connectors. They build relationships that plain HTML can't. This is where ARIA gets really powerful, as you can "wire up" different parts of your page for screen reader users.

**Examples of Properties that DON'T exist in HTML:**

  * `aria-controls`: The most common one. It explicitly links one element to another. For example, a `role="tab"` uses `aria-controls` to point to the `role="tabpanel"` it controls.
      * `<button aria-controls="content-panel-1">`
  * `aria-labelledby`: Tells an element "your name is *over there*." This is used to link an element to the text that serves as its label. This is crucial for custom components.
      * `<div role="dialog" aria-labelledby="dialog-title">`
  * `aria-describedby`: Tells an element "extra instructions for you are *over there*." This is perfect for linking an input to its helper text or error message.
      * `<input aria-describedby="password-rules-text">`

HTML can't do this. There's no native HTML attribute that lets you tell a button, "The element you control is that `<div>` on the other side of the page." ARIA can.

## 3. States: The "Now"

**States** answer the question, "What is this element's *condition* right now?"

States are dynamic. They are meant to be changed with JavaScript as the user interacts with your page. This is how you tell a screen reader what's happening.

**Examples of States that DON'T exist in HTML (mostly):**

  * `aria-expanded="true"` or `"false"`: Tells a screen reader if a menu, accordion, or combobox is currently open or closed.
  * `aria-selected="true"` or `"false"`: Tells a screen reader if this `role="tab"` is the *currently selected* tab.
  * `aria-hidden="true"`: Hides an element from screen readers (but not visually).
  * `aria-disabled="true"`: Disables a *custom* ARIA component (like a `div` with `role="button"`). While HTML has the `disabled` attribute, it only works on form elements. `aria-disabled` works on *anything*.

## Tying It All Together

Let's look at a quick (non-functional) skeleton of a tabbed interface. Don't worry about the JavaScript yet—just see how the vocabulary works.

```html
<div role="tablist" aria-labelledby="tablist-label">
  <h3 id="tablist-label">My Awesome Tabs</h3>
  
  <button role="tab"
          aria-selected="true"
          aria-controls="panel-1">
    Tab 1
  </button>
  
  <button role="tab"
          aria-selected="false"
          aria-controls="panel-2">
    Tab 2
  </button>
</div>

<div role="tabpanel" id="panel-1">
  <p>Content for the first tab.</p>
</div>

<div role="tabpanel" id="panel-2" hidden>
  <p>Content for the second tab.</p>
</div>
```

Look at all that information\!

  * A screen reader knows this is a `tablist` (a **Role**).
  * It knows the `tablist`'s name is "My Awesome Tabs" (an `aria-labelledby` **Property**).
  * It knows "Tab 1" is the currently active tab (an `aria-selected` **State**).
  * It knows "Tab 1" *controls* the panel with the ID "panel-1" (an `aria-controls` **Property**).

We've just described a complex component using zero new HTML tags. That's the power of ARIA.

## What's Next

This is the "what." In our next post, we'll get to the "how." We'll start with one of the most fundamental and common ARIA patterns—a "Disclosure" (you probably call it an "Accordion")—and build it from scratch, connecting the roles, properties, and states with the JavaScript needed to make it all work.

Stay tuned.