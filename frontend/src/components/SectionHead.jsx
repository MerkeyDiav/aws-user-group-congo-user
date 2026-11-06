export default function SectionHead({ title, children, action }) {
  return (
    <div className={`section__head ${action ? 'section__head--split' : ''}`}>
      <div>
        <h2 className="section-title">{title}</h2>
        {children && <p className="lead">{children}</p>}
      </div>
      {action}
    </div>
  );
}
