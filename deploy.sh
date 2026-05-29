#!/usr/bin/env bash
set -euo pipefail

# ─── Config ────────────────────────────────────────────────────────────────
APP_NAME="${APP_NAME:-registro-estructuras}"
ENV_NAME="${ENV_NAME:-registro-estructuras-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
EB_BUCKET="${EB_BUCKET:-elasticbeanstalk-$AWS_REGION-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo '000000000000')}"
DOCKER_COMPOSE_FILE="docker-compose.aws.yml"

# ─── Prerrequisitos ───────────────────────────────────────────────────────
echo "==> Verificando herramientas..."
command -v aws >/dev/null 2>&1 || { echo "Error: Se requiere AWS CLI"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: Se requiere Docker"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "Error: Se requiere jq"; exit 1; }

echo "==> Verificando sesion AWS..."
aws sts get-caller-identity --region "$AWS_REGION" >/dev/null || {
  echo "Error: No hay sesion AWS activa. Ejecuta 'aws configure' primero."
  exit 1
}

# ─── Build docker-compose con imagenes ECR ─────────────────────────────
echo "==> Creando ECR repositorios si no existen..."
for repo in "$APP_NAME-backend" "$APP_NAME-frontend"; do
  if ! aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" &>/dev/null; then
    aws ecr create-repository --repository-name "$repo" --region "$AWS_REGION" >/dev/null
    echo "    Repositorio $repo creado"
  fi
done

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$AWS_REGION")
REGISTRY="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
TAG="$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')"

echo "==> Login a ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"

echo "==> Construyendo y subiendo backend..."
docker build -t "$APP_NAME-backend:$TAG" -t "$REGISTRY/$APP_NAME-backend:$TAG" ./backend
docker tag "$APP_NAME-backend:$TAG" "$REGISTRY/$APP_NAME-backend:$TAG" 2>/dev/null || true
docker push "$REGISTRY/$APP_NAME-backend:$TAG"

echo "==> Construyendo y subiendo frontend..."
docker build \
  --build-arg VITE_API_URL=/api/v1 \
  -t "$APP_NAME-frontend:$TAG" \
  -t "$REGISTRY/$APP_NAME-frontend:$TAG" \
  ./frontend
docker tag "$APP_NAME-frontend:$TAG" "$REGISTRY/$APP_NAME-frontend:$TAG" 2>/dev/null || true
docker push "$REGISTRY/$APP_NAME-frontend:$TAG"

echo "==> Generando docker-compose.aws.yml con ECR tags..."
sed \
  -e "s|image: registro-estructuras-backend|image: $REGISTRY/$APP_NAME-backend:$TAG|" \
  -e "s|image: registro-estructuras-frontend|image: $REGISTRY/$APP_NAME-frontend:$TAG|" \
  "$DOCKER_COMPOSE_FILE" > docker-compose.aws.deploy.yml

echo "==> Empaquetando version..."
ZIP_FILE="/tmp/${APP_NAME}-${TAG}.zip"
(
  cd "$(dirname "$0")"
  zip -r "$ZIP_FILE" \
    docker-compose.aws.deploy.yml \
    .ebignore \
    -x "node_modules/*" "dist/*" ".git/*" "*.md" "**/node_modules/*" "**/dist/*"
) >/dev/null

echo "==> Subiendo version a S3..."
aws s3 cp "$ZIP_FILE" "s3://${EB_BUCKET}/${APP_NAME}/${TAG}.zip" --region "$AWS_REGION"

echo "==> Creando nueva version de aplicacion..."
aws elasticbeanstalk create-application-version \
  --application-name "$APP_NAME" \
  --version-label "$TAG" \
  --source-bundle S3Bucket="${EB_BUCKET}",S3Key="${APP_NAME}/${TAG}.zip" \
  --region "$AWS_REGION" \
  --no-cli-pager

echo "==> Desplegando..."
aws elasticbeanstalk update-environment \
  --environment-name "$ENV_NAME" \
  --version-label "$TAG" \
  --region "$AWS_REGION" \
  --no-cli-pager

echo ""
echo "✅ Deploy exitoso a $ENV_NAME"
echo "   Version: $TAG"
rm -f "$ZIP_FILE" docker-compose.aws.deploy.yml
