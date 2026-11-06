import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { excerpt, formatPublishDate, isVideoPost, postThumbnail } from '../utils/posts.js';

export default function PostCard({ post, event }) {
  const url = `/actualites/${post.id}`;
  const thumb = postThumbnail(post);
  const video = isVideoPost(post);

  return (
    <article className="post-card">
      <Link to={url} className="post-card__media" tabIndex={-1} aria-hidden="true">
        {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span className="post-card__placeholder"><Icon name={video ? 'video' : 'edit'} size={28} /></span>}
        {video && (
          <span className="post-card__play">
            <Icon name="play" size={22} />
          </span>
        )}
      </Link>
      <div className="post-card__body">
        <div className="post-card__meta">
          <span className={`post-badge ${video ? 'post-badge--video' : ''}`}>{video ? 'Vidéo' : 'Article'}</span>
          <time dateTime={post.publishAt}>{formatPublishDate(post.publishAt)}</time>
        </div>
        <h3>
          <Link to={url}>{post.title}</Link>
        </h3>
        {excerpt(post) && <p>{excerpt(post)}</p>}
        {event && (
          <p className="post-card__event">
            <Icon name="calendar" size={15} /> {event.title}
          </p>
        )}
      </div>
    </article>
  );
}
