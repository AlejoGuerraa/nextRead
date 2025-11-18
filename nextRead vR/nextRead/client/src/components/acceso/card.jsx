export const FeatureCard = ({ icon, title, description }) => (
    <div className="feature-card">
        <img src={icon} alt="" className='feature-icon' />
        <h4 className="feature-title">{title}</h4>
        <p className="feature-description">{description}</p>
    </div>
);