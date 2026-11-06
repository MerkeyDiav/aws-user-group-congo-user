terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
  }

  # Bucket créé par infra/bootstrap. Le verrouillage se fait par fichier dans S3 (use_lockfile).
  backend "s3" {
    bucket       = "awsug-kin-tfstate-533003975207"
    key          = "backend/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "aws-ug-kinshasa"
      ManagedBy = "terraform"
    }
  }
}
