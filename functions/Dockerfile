FROM python:3.11-slim

# Install system dependencies and LaTeX packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-latex-recommended \
    texlive-plain-generic \
    lmodern \
    texlive-font-utils \
    fonts-font-awesome \
    fonts-lato \
    fonts-noto-core \
    fonts-liberation \
    fonts-dejavu \
    wget \
    unzip \
    gnupg \
    ca-certificates \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Update font cache
RUN fc-cache -f -v

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN python -m playwright install chromium
RUN python -m playwright install-deps chromium

# Copy application code
COPY . .

# Create and set permissions for LaTeX temp directory
RUN mkdir -p /tmp/latex && chmod 777 /tmp/latex

# Verify pdflatex is available
RUN which pdflatex

# Set environment variables
ENV PORT=8080

# Command to run the application
CMD ["python", "main.py"]
