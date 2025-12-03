#!/bin/bash
# Install BR3 git hooks

HOOKS_DIR=".buildrunner/hooks"
GIT_HOOKS_DIR=".git/hooks"

if [ ! -d "$GIT_HOOKS_DIR" ]; then
    echo "❌ Not a git repository"
    exit 1
fi

for hook in pre-commit pre-push; do
    if [ -f "$HOOKS_DIR/$hook" ]; then
        cp "$HOOKS_DIR/$hook" "$GIT_HOOKS_DIR/$hook"
        chmod +x "$GIT_HOOKS_DIR/$hook"
        echo "✅ Installed $hook hook"
    fi
done

echo "✅ BR3 hooks installed"
