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

It's a lisp-like, so everything is brackets. '(' starts a list. ')' finishes and evaluates it, whitespace separates symbols. Lists may be nested. Symbols starting with a digit or '-' are treated as numbers, everything else is a string. 
Strings can be quoted with single- or double-quotes (no escaping yet).

When _evaluating_ symbols are looked up in the cascading symbol table, and lists are executed. 

When _executing_ the first (head) item is evaluated. If it is a function,
the result is the return value of executing the function, passing the list as a parameter. 
If it is not a function, the result is the list itself.

The language itself does nothing other than parse and evaluate lists. To do any real work 
requires functions. Luckily, some are supplied. More may come later ;)

### Built-in Functions

* **def**:
  add a named entry to the user section of the symbol table

  ```
  (def a 13) (a) =>
  13
  ```

  ```
  (def "long name" (tinky-winky dipsy lala po)) ("long name") =>
  tinky-winky dipsy lala po
  ```

* **primitive**:
  load a function defined in a native programming language (in this case Javascript)

  ```
  (def minus (primitive "./library/minus.js")) (minus 5 4) =>
  1
  ```

* **include**:
  execute the text of an external file

  For example, if we have a file 'tmp.brack' containing '(def a 13)'

  ```
  (include "./tmp.brack") a =>
  13
  ```

* **lambda**:
  the key to everything else: create a user-defined function

  ```
  (def e (lambda (a) (echo "this is a" a)) (e "user function") =>
  this is a user function
  ```

  ```
  ((lambda (a) (echo "this is a" a)) "direct call") =>
  this is a direct call
  ```

* **map**:
  apply a named function to the remaining parameters and return the results as a list

  ```
  (map (lambda (x) (plus 2 x)) 1 2 3) =>
  3,4,5
  ```

  ```
  (map echo a b c) =>
  a
  b
  c
  ```

* **reduce**:
  apply a named function to pairs of the remaining parameters and accumulate the result

  ```
  (reduce plus 1 2 3) =>
  6
  ```

  ```
  (reduce plus a b c) =>
  abc
  ```

* **echo**:
  send its parameter to standard output, in a (mostly) human-readable format

  ```
  (echo "hello, world") =>
  hello, world
  ```

* **plus**:
  "add" its first two parameters (numerically or textually, depending on the supplied values)

  ```
  (plus 1 2) =>
  3
  ```

  ```
  (plus a b) =>
  ab
  ```
  