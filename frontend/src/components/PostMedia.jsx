import { youtubeId } from '../utils/posts.js';

/** Média principal d'une publication : vidéo envoyée, vidéo YouTube, ou photo. */
export default function PostMedia({ post }) {
  if (post.type === 'video' && post.video) {
    return (
      <div className="post-media post-media--video">
        <video src={post.video} poster={post.image || undefined} controls playsInline preload="metadata">
          Votre navigateur ne peut pas lire cette vidéo.
        </video>
      </div>
    );
  }

  const ytId = post.type === 'video' && youtubeId(post.youtubeUrl);
  if (ytId) {
    return (
      <div className="post-media post-media--youtube">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytId}`}
          title={post.title}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (post.image) {
    return (
      <div className="post-media">
        <img src={post.image} alt="" />
      </div>
    );
  }
  return null;
}
