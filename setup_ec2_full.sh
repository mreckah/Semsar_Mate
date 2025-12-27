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

# -------------------------
# INSTALL REQUIRED PACKAGES
# -------------------------
echo "Installing dependencies..."
sudo apt-get install -y \
    curl gnupg lsb-release apt-transport-https \
    openjdk-17-jdk unzip git net-tools

# -------------------------
# INSTALL DOCKER
# -------------------------
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo systemctl enable --now docker
else
    echo "Docker already installed."
fi

# -------------------------
# DOCKER PERMISSIONS
# -------------------------
echo "Setting up Docker permissions..."
sudo usermod -aG docker $USER_NAME
# This is the fix for your Jenkins Pipeline error:
sudo usermod -aG docker jenkins || true 

# -------------------------
# INSTALL JENKINS
# -------------------------
if ! command -v jenkins &> /dev/null; then
    echo "Installing Jenkins..."
    sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
        https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
    
    echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
        https://pkg.jenkins.io/debian-stable binary/" | sudo tee \
        /etc/apt/sources.list.d/jenkins.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y jenkins
else
    echo "Jenkins already installed."
fi

# -------------------------
# JENKINS IPV4 & PERMISSION OVERRIDE
# -------------------------
echo "Configuring Jenkins Systemd Overrides..."
sudo mkdir -p /etc/systemd/system/jenkins.service.d/

cat <<EOF | sudo tee /etc/systemd/system/jenkins.service.d/override.conf
[Service]
Environment="JAVA_OPTS=-Djava.net.preferIPv4Stack=true -Djava.net.preferIPv4Addresses=true"
Environment="JENKINS_OPTS=--httpListenAddress=0.0.0.0 --httpPort=${JENKINS_PORT}"
EOF

# Reload and Restart to apply Docker group and IPv4 changes
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo systemctl restart jenkins

# -------------------------
# DEPLOY APP CONTAINER
# -------------------------
echo "Deploying Application Container..."
# Ensure docker is ready
sudo chmod 666 /var/run/docker.sock

docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}
docker rm -f ${APP_NAME} || true
docker run -d \
  --name ${APP_NAME} \
  --restart always \
  -p ${HOST_PORT}:${APP_PORT} \
  ${DOCKER_IMAGE}:${DOCKER_TAG}

# -------------------------
# SUMMARY
# -------------------------
PUBLIC_IP=$(curl -s ifconfig.me)
ADMIN_PWD=$(sudo cat /var/lib/jenkins/secrets/initialAdminPassword || echo "Wait for Jenkins to start...")

echo "------------------------------------------------"
echo "Deployment Completed Successfully!"
echo "App URL:      http://${PUBLIC_IP}"
echo "Jenkins URL:  http://${PUBLIC_IP}:${JENKINS_PORT}"
echo "Admin Password: ${ADMIN_PWD}"
echo "------------------------------------------------"