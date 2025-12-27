#!/usr/bin/env bash
set -e

# -------------------------
# CONFIGURATION
# -------------------------
APP_NAME="semsar-mate"
DOCKER_IMAGE="oussama75/semsar-aws-mate"
DOCKER_TAG="latest"
HOST_PORT=80
APP_PORT=5000
JENKINS_PORT=8080
USER_NAME=$(whoami)

# -------------------------
# SYSTEM UPDATE
# -------------------------
echo "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# -------------------------
# INSTALL REQUIRED PACKAGES
# -------------------------
echo "Installing dependencies..."
sudo apt-get install -y \
    curl \
    gnupg \
    lsb-release \
    apt-transport-https \
    openjdk-11-jdk \
    unzip \
    git

# -------------------------
# INSTALL DOCKER
# -------------------------
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo systemctl enable docker
    sudo systemctl start docker
else
    echo "Docker already installed."
fi

# -------------------------
# DOCKER PERMISSIONS
# -------------------------
echo "Adding user to docker group..."
sudo usermod -aG docker $USER_NAME

# Apply docker group changes immediately
newgrp docker <<EOF

# -------------------------
# INSTALL JENKINS
# -------------------------
if ! command -v java &> /dev/null; then
    echo "Installing Java (required for Jenkins)..."
    sudo apt-get install -y openjdk-11-jdk
fi

if ! command -v jenkins &> /dev/null; then
    echo "Installing Jenkins..."
    curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
        /usr/share/keyrings/jenkins-keyring.asc > /dev/null

    echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
        https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
        /etc/apt/sources.list.d/jenkins.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y jenkins
    sudo systemctl enable jenkins
    sudo systemctl start jenkins
else
    echo "Jenkins already installed."
fi

# -------------------------
# PULL DOCKER IMAGE
# -------------------------
echo "Pulling Docker image for app..."
docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}

# -------------------------
# STOP OLD CONTAINER
# -------------------------
echo "Stopping old app container if exists..."
docker rm -f ${APP_NAME} || true

# -------------------------
# RUN APP CONTAINER
# -------------------------
echo "Starting application container..."
docker run -d \
  --name ${APP_NAME} \
  --restart always \
  -p ${HOST_PORT}:${APP_PORT} \
  ${DOCKER_IMAGE}:${DOCKER_TAG}

echo "Deployment completed."
echo "App URL: http://$(curl -s ifconfig.me)"
echo "Jenkins URL: http://$(curl -s ifconfig.me):${JENKINS_PORT}"

EOF
