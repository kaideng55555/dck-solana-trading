#!/bin/bash
# SSH connection helper with safe flags and key management
# Usage: 
#   SSH_USER=ubuntu SSH_HOST=your-server.com bash ssh-connect.sh
#   SSH_KEY_PATH=~/.ssh/custom_key SSH_USER=root SSH_HOST=1.2.3.4 bash ssh-connect.sh

# Safe shell flags
set -Eeuo pipefail

# Defaults (override via env)
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519}"
SSH_USER="${SSH_USER:?❌ Error: SSH_USER not set. Usage: SSH_USER=ubuntu SSH_HOST=server.com bash ssh-connect.sh}"
SSH_HOST="${SSH_HOST:?❌ Error: SSH_HOST not set. Usage: SSH_USER=ubuntu SSH_HOST=server.com bash ssh-connect.sh}"

echo "🔐 SSH Connection Helper"
echo "========================"
echo "User: $SSH_USER"
echo "Host: $SSH_HOST"
echo "Key:  $SSH_KEY_PATH"
echo ""

# Expand ~ and verify key exists
SSH_KEY_PATH="$(eval echo "$SSH_KEY_PATH")"
if [[ ! -f "$SSH_KEY_PATH" ]]; then
  echo "❌ Key file not found: $SSH_KEY_PATH" >&2
  echo "" >&2
  echo "Available keys:" >&2
  ls -la ~/.ssh/*.pub 2>/dev/null | awk '{print "  " $9}' || echo "  No keys found" >&2
  echo "" >&2
  echo "Generate a new key:" >&2
  echo "  ssh-keygen -t ed25519 -C \"your_email@example.com\"" >&2
  exit 1
fi

# Fix permissions (avoids 'Bad permissions' error)
echo "🔧 Setting key permissions..."
chmod 600 "$SSH_KEY_PATH" 2>/dev/null || {
  echo "⚠️  Warning: Could not set permissions on $SSH_KEY_PATH" >&2
}

# Check if key has passphrase
if ssh-keygen -y -P "" -f "$SSH_KEY_PATH" >/dev/null 2>&1; then
  echo "✓ Key has no passphrase"
else
  echo "ℹ️  Key is passphrase-protected (you may be prompted)"
fi

# Try to add to ssh-agent (optional, improves convenience)
echo "🔑 Adding key to ssh-agent..."
if command -v ssh-add >/dev/null 2>&1; then
  # Start agent if not running (Linux)
  if [[ -z "${SSH_AUTH_SOCK:-}" ]]; then
    eval "$(ssh-agent -s)" >/dev/null 2>&1 || true
  fi
  
  # Add key (macOS: -K stores in Keychain, --apple-use-keychain for modern versions)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    ssh-add --apple-use-keychain "$SSH_KEY_PATH" >/dev/null 2>&1 || \
    ssh-add -K "$SSH_KEY_PATH" >/dev/null 2>&1 || \
    ssh-add "$SSH_KEY_PATH" >/dev/null 2>&1 || true
  else
    ssh-add "$SSH_KEY_PATH" >/dev/null 2>&1 || true
  fi
  echo "✓ Key added to agent"
else
  echo "⚠️  ssh-add not found, skipping agent"
fi

# Smoke test connection
echo ""
echo "🧪 Testing SSH connection..."
if ssh -i "$SSH_KEY_PATH" \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=10 \
    -o BatchMode=yes \
    "$SSH_USER@$SSH_HOST" 'echo "✅ SSH connection successful!"' 2>/dev/null; then
  echo ""
  echo "✅ Connection verified!"
  echo ""
  echo "Connect manually with:"
  echo "  ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST"
  echo ""
  echo "Or use this environment:"
  echo "  export SSH_KEY_PATH=\"$SSH_KEY_PATH\""
  echo "  export SSH_USER=\"$SSH_USER\""
  echo "  export SSH_HOST=\"$SSH_HOST\""
  exit 0
else
  echo ""
  echo "❌ SSH connection failed!"
  echo ""
  echo "Troubleshooting steps:"
  echo ""
  echo "1. Check if host is reachable:"
  echo "   ping -c 3 $SSH_HOST"
  echo ""
  echo "2. Verify SSH service is running on remote:"
  echo "   telnet $SSH_HOST 22"
  echo ""
  echo "3. Check if your public key is authorized:"
  echo "   cat $SSH_KEY_PATH.pub"
  echo "   # Add this to ~/.ssh/authorized_keys on remote server"
  echo ""
  echo "4. Try with password authentication:"
  echo "   ssh -o PubkeyAuthentication=no $SSH_USER@$SSH_HOST"
  echo ""
  echo "5. Check SSH logs on server:"
  echo "   sudo tail -f /var/log/auth.log  # Ubuntu/Debian"
  echo "   sudo tail -f /var/log/secure     # RHEL/CentOS"
  echo ""
  exit 1
fi
