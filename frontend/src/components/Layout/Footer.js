import React from 'react';
import { Link } from 'react-router-dom';

const Footer = ({ userRole = 'admin' }) => {
    // Navigation links based on role
    const getNavLinks = () => {
        if (userRole === 'admin') {
            return [
                { path: '/admin/vendors', label: 'VENDORS' },
                { path: '/admin/inquiries', label: 'INQUIRIES' },
                { path: '/admin/orders', label: 'ORDERS' },
                { path: '/admin/profile', label: 'PROFILE' },
            ];
        } else {
            return [
                { path: '/supplier/inquiries', label: 'INQUIRIES' },
                { path: '/supplier/orders', label: 'ORDERS' },
                { path: '/supplier/profile', label: 'PROFILE' },
            ];
        }
    };

    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                {/* Top Row: Logo | INFO | Quick Contact */}
                <div style={styles.topRow}>
                    {/* Left: Logo */}
                    <div style={styles.logoColumn}>
                        <img
                            src="/images/logo-krisba-white.png"
                            alt="Krisba Healthcare"
                            style={styles.logo}
                        />
                    </div>

                    {/* Middle: INFO */}
                    <div style={styles.centerColumn}>
                        <div style={styles.infoWrapper}>
                            <h3 style={styles.heading}>INFO</h3>
                            <div style={styles.infoLinks}>
                                {getNavLinks().map((link, index) => (
                                    <Link
                                        key={index}
                                        to={link.path}
                                        className="footer-link"
                                        style={styles.infoLink}
                                        onClick={() => window.scrollTo(0, 0)}
                                    >
                                        {`> ${link.label}`}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Contact */}
                    <div style={styles.contactColumn}>
                        <div style={styles.contactWrapper}>
                            <h3 style={styles.heading}>QUICK CONTACT</h3>
                            <div style={styles.contactList}>
                                <div style={styles.contactItem}>
                                    <img
                                        src="/images/icon-location.png"
                                        alt="Location"
                                        style={styles.contactIcon}
                                    />
                                    <span style={styles.contactText}>
                                        826/B/12 Pr, Ghatkopar Indi Estate,<br />
                                        LBS Road, Ghatkopar (W)<br />
                                        Mumbai, Maharashtra 400 086
                                    </span>
                                </div>
                                <div style={styles.contactItem}>
                                    <img
                                        src="/images/icon-phone.png"
                                        alt="Phone"
                                        style={styles.contactIcon}
                                    />
                                    <span style={styles.contactText}>
                                        +91 93215 38212<br />
                                        +91 93231 39797
                                    </span>
                                </div>
                                <div style={styles.contactItem}>
                                    <img
                                        src="/images/icon-email.png"
                                        alt="Email"
                                        style={styles.contactIcon}
                                    />
                                    <span style={styles.contactText}>
                                        krisbahealthcare@gmail.com
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Separator Line */}
                <div style={styles.separator}></div>

                {/* Social Media Section */}
                <div style={styles.socialSection}>
                    <p style={styles.followText}>Follow Us On:</p>
                    <div style={styles.socialIcons}>
                        <a href="#" className="social-circle" style={styles.socialCircle}>
                            <img
                                src="/images/icon-facebook.png"
                                alt="Facebook"
                                style={styles.socialIcon}
                            />
                        </a>
                        <a href="#" className="social-circle" style={styles.socialCircle}>
                            <img
                                src="/images/icon-x.png"
                                alt="X"
                                style={styles.socialIcon}
                            />
                        </a>
                        <a href="#" className="social-circle" style={styles.socialCircle}>
                            <img
                                src="/images/icon-youtube.png"
                                alt="YouTube"
                                style={styles.youtubeIcon}
                            />
                        </a>
                        <a
                            href="https://www.instagram.com/krisbahealthcare?igsh=MnRlcGFoMzRyaHc3"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-circle"
                            style={styles.socialCircle}
                        >
                            <img
                                src="/images/icon-instagram.png"
                                alt="Instagram"
                                style={styles.socialIcon}
                            />
                        </a>
                    </div>
                </div>

                {/* Separator Line */}
                <div style={styles.separator}></div>

                {/* Copyright */}
                <div style={styles.copyrightSection}>
                    <p style={styles.copyright}>
                        <strong>© 2025 | Krisba Healthcare Pvt. Ltd.</strong>
                    </p>
                </div>
            </div>
            <style>
                {`
                    .footer-link {
                        transition: transform 0.3s ease, color 0.3s ease;
                        display: inline-block;
                    }
                    .footer-link:hover {
                        transform: translateX(10px);
                        color: #ffffff !important;
                    }
                    .social-circle {
                        border: 1px solid #333333; /* Matches separator line */
                        transition: all 0.3s ease;
                    }
                    .social-circle:hover {
                        border: 2px solid #ffffff; /* Bolder and white on hover */
                        transform: scale(1.05);
                    }
                `}
            </style>
        </footer>
    );
};

const styles = {
    footer: {
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        fontFamily: "'Poppins', sans-serif",
        marginTop: 'auto',
        paddingTop: '50px',
        paddingBottom: '30px',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
    },
    topRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '40px',
        paddingBottom: '40px',
        alignItems: 'flex-start',
    },
    logoColumn: {
        display: 'flex',
        justifyContent: 'center', // Centered horizontally
        alignItems: 'flex-start',
    },
    centerColumn: {
        display: 'flex',
        justifyContent: 'center',
    },
    infoWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    contactColumn: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    contactWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    logo: {
        height: '120px', // Reduced size
        width: 'auto',
        marginTop: '15px', // Added to balance vertical spacing
    },
    heading: {
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: '400',
        marginBottom: '20px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
    },
    contactList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    contactItem: {
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
    },
    contactIcon: {
        width: '16px',
        height: '16px',
        marginTop: '3px',
        opacity: 0.9,
    },
    contactText: {
        color: '#cccccc',
        fontSize: '13px',
        lineHeight: '1.7',
    },
    infoLinks: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    infoLink: {
        color: '#cccccc',
        fontSize: '13px',
        textDecoration: 'none',
    },
    separator: {
        height: '2px',
        backgroundColor: '#333333',
        margin: '30px 0',
    },
    socialSection: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        paddingTop: '8px', // Further reduced spacing
        paddingBottom: '8px', // Further reduced spacing
    },
    followText: {
        color: '#ffffff',
        fontSize: '14px',
        margin: 0,
        fontWeight: '400',
    },
    socialIcons: {
        display: 'flex',
        gap: '20px',
    },
    socialCircle: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        backgroundColor: '#000000',
        borderRadius: '50%',
        textDecoration: 'none',
        // Border is handled by CSS class for hover effect
    },
    socialIcon: {
        width: '20px',
        height: '20px',
        objectFit: 'contain',
    },
    youtubeIcon: {
        width: '18px',
        height: '12px',
        objectFit: 'contain',
    },
    copyrightSection: {
        textAlign: 'center',
        paddingTop: '20px',
        paddingBottom: '10px',
    },
    copyright: {
        color: '#ffffff',
        fontSize: '13px',
        margin: 0,
    }
};

export default Footer;


