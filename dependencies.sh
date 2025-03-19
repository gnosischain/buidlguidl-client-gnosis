os_name=$(uname -s)

echo -e "\n🕵️ Checking for dependencies\n"

if [ "$os_name" = "Linux" ]; then
  # Check for Node
  if command -v node >/dev/null 2>&1; then
      echo -e "✅ Node is installed. Version: $(node -v)"
  else
    read -r -p "❓ Node is not installed. Do you want to install it? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "\n💪 Installing Node"
        cd ~
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt install -y nodejs
    else
      echo -e "\n👎 Node installation canceled.\n"
    fi
  fi

  # Check for Yarn (install version 4.5.1)
  if command -v yarn >/dev/null 2>&1; then
      echo -e "\n✅ Yarn is installed. Version: $(yarn -v)"
  else
    read -r -p "❓ Yarn is not installed. Do you want to install Yarn v4.5.1? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "\n💪 Installing Yarn v4.5.1"
        sudo npm install -g yarn@4.5.1
    else
      echo -e "\n👎 Yarn installation canceled.\n"
    fi
  fi

  # Check for Git
  if command -v git >/dev/null 2>&1; then
      echo -e "\n✅ Git is installed. Version: $(git --version)"
  else
    read -r -p "❓ Git is not installed. Do you want to install it? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "\n💪 Installing Git"
        sudo apt-get install -y git
    else
      echo -e "\n👎 Git installation canceled.\n"
    fi
  fi

  # Check for GNU Make
  if command -v make >/dev/null 2>&1; then
      echo -e "\n✅ GNU Make is installed. Version:"
      make -v | head -n 1
  else
    read -r -p "❓ GNU Make is not installed. Do you want to install it? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "\n💪 Installing GNU Make (via build-essential)"
        sudo apt-get install -y build-essential
    else
      echo -e "\n👎 GNU Make installation canceled.\n"
    fi
  fi

  # Check for Perl-Digest-SHA
  if perl -MDigest::SHA -e '1' >/dev/null 2>&1; then
      echo -e "\n✅ Perl-Digest-SHA is installed."
  else
    read -r -p "❓ Perl-Digest-SHA is not installed. Do you want to install it? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "\n💪 Installing Perl-Digest-SHA"
        sudo apt-get install -y libdigest-sha-perl
    else
      echo -e "\n👎 Perl-Digest-SHA installation canceled.\n"
    fi
  fi

elif [ "$os_name" = "Darwin" ]; then
  # Check for Node
  if command -v node >/dev/null 2>&1; then
      echo -e "✅ Node is installed. Version: $(node -v)"
  else
    read -r -p "❓ Node is not installed. Do you want to install it? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      echo -e "\n💪 Installing Node"
      brew install node
    else
      echo -e "\n👎 Node installation canceled.\n"
    fi
  fi

  # Check for Yarn (install version 4.5.1)
  if command -v yarn >/dev/null 2>&1; then
      echo -e "\n✅ Yarn is installed. Version: $(yarn -v)"
  else
    read -r -p "❓ Yarn is not installed. Do you want to install Yarn v4.5.1? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      echo -e "\n💪 Installing Yarn v4.5.1"
      sudo npm install -g yarn@4.5.1
    else
      echo -e "\n👎 Yarn installation canceled.\n"
    fi
  fi

  # Check for Git
  if command -v git >/dev/null 2>&1; then
      echo -e "\n✅ Git is installed. Version: $(git --version)"
  else
    read -r -p "❓ Git is not installed. Do you want to install it? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      echo -e "\n💪 Installing Git"
      brew install git
    else
      echo -e "\n👎 Git installation canceled.\n"
    fi
  fi

  # Check for GNU Make
  if command -v make >/dev/null 2>&1; then
      echo -e "\n✅ GNU Make is installed. Version:"
      make -v | head -n 1
  else
    read -r -p "❓ GNU Make is not installed. Do you want to install it? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      echo -e "\n💪 Installing GNU Make"
      brew install make
    else
      echo -e "\n👎 GNU Make installation canceled.\n"
    fi
  fi

  # Check for Perl-Digest-SHA
  if perl -MDigest::SHA -e '1' >/dev/null 2>&1; then
    echo -e "\n✅ Perl-Digest-SHA is installed."
  else
    read -r -p "❓ Perl-Digest-SHA is not installed. Do you want to install it? [y/n] " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      echo -e "\n💪 Installing Perl-Digest-SHA"
      brew install perl
      brew install cpanminus
      cpanm Digest::SHA
    else
      echo -e "\n👎 Perl-Digest-SHA installation canceled.\n"
    fi
  fi

else
  echo "Operating system not supported by this script."
fi
