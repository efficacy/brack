# brack

A minimal lisp-like language

reads from standard input, writes to standard output

## Installation

At the moment it's just one js file. install it however you like

## Usage:
To use as a repl, just 
```
  node brack.js
```
exit using Ctrl-D

To use with a script
```
  node brack.js < awesome.brack
```

## The Language

It's a lisp-like, so everything is brackets. '(' starts a list. ')' finishes and evaluates it, 
whitespace separates symbols. Lists
may be nested. Strings can be quoted with single- or double-quotes (no escaping yet). 
Symbols starting with a digit or '-' are treated as numbers.
To evaluate a list, the first (head) element is looked-up in the symbol table. If it is a function,
the result is the return value of executing the function, passing the list as a parameter. 
If it is not a function, the result is the list itself.

The language itself does nothing other than parse and evaluate lists. To do any real work 
requires functions. Luckily, some are supplied ;)

## Built-in Functions

*echo*: send its parameters to standard output, in a mostly human-readable format