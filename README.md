# brack

A minimal lisp-like language in node.js

Reads from standard input, writes to standard output

## Installation

At the moment it's just one js file. install it however you like

## Usage
To use as a repl, just 
```
  node brack.js
```
exit using Ctrl-D

To use with a script
```
  node brack.js < awesome.brack
```

### Usage Example
```
(echo "this is a string" (symbols in a list (4)))
```

## The Language

It's a lisp-like, so everything is brackets. '(' starts a list. ')' finishes and evaluates it, whitespace separates symbols. Lists
may be nested. Symbols starting with a digit or '-' are treated as numbers, everything else is a string. Strings can be quoted with single- or double-quotes (no escaping yet).

When _building_ a list,each string is looked up in the symbol table; if something is found there it is added to the list, otherwise the.raw string is used.

When _evaluating_ a list, the first (head) symbol is looked-up in the symbol table. If it is a function,
the result is the return value of executing the function, passing the list as a parameter. 
If it is not a function, the result is the list itself.

The language itself does nothing other than parse and evaluate lists. To do any real work 
requires functions. Luckily, some are supplied. More may come later ;)

### Built-in Functions

* **echo**:
  send its parameter to standard output, in a (mostly) human-readable format
