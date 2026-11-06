# ---------------------------------------------------------------------------
# Photos envoyées depuis l'espace admin : bucket S3 privé servi par CloudFront
# ---------------------------------------------------------------------------
# Le bucket n'est jamais public : seul CloudFront peut le lire (Origin Access Control).
# Les fichiers ont un nom unique, ils sont donc mis en cache un an sans risque.

resource "aws_s3_bucket" "media" {
  bucket = "${var.prefix}-media-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Permet de récupérer une photo remplacée ou supprimée par erreur pendant 30 jours.
resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    id     = "anciennes-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
  depends_on = [aws_s3_bucket_versioning.media]
}

resource "aws_cloudfront_origin_access_control" "media" {
  name                              = "${var.prefix}-media"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "media" {
  enabled         = true
  comment         = "Photos du site AWS User Group Kinshasa"
  price_class     = "PriceClass_200" # inclut les points de présence en Afrique
  http_version    = "http2and3"
  is_ipv6_enabled = true

  origin {
    origin_id                = "media"
    domain_name              = aws_s3_bucket.media.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
  }

  default_cache_behavior {
    target_origin_id       = "media"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_s3_bucket_policy" "media" {
  bucket = aws_s3_bucket.media.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "CloudFrontRead"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.media.arn}/*"
      Condition = { StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.media.arn } }
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.media]
}

# Les vidéos sont envoyées directement par le navigateur (URL signée par la Lambda admin) :
# S3 doit accepter ces envois depuis le site.
resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_methods = ["PUT"]
    allowed_origins = var.allowed_origins
    allowed_headers = ["content-type"]
    max_age_seconds = 3600
  }
}
