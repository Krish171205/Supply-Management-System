import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TopNavigation = ({ links, user, onLogout }) => {
    const location = useLocation();

    return (
        <div style={styles.wrapper}>
            {/* Main Header */}
            <header style={styles.header}>
                <div style={styles.container}>
                    <div style={styles.logoContainer}>
                        <img
                            src="https://krisbahealthcare.com/img/logo.png"
                            alt="Krisba Healthcare"
                            style={styles.logo}
                        />
                    </div>
                    <nav style={styles.nav}>
                        <ul style={styles.navList}>
                            {links.map((link) => (
                                <li key={link.path} style={styles.navItem}>
                                    <Link
                                        to={link.path}
                                        style={{
                                            ...styles.navLink,
                                            color: location.pathname.includes(link.path) ? '#3C6E69' : '#333',
                                        }}
                                    >
                                        {link.label.toUpperCase()}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div style={styles.userSection}>
                            <button onClick={onLogout} style={styles.logoutBtn}>
                                LOGOUT
                            </button>
                        </div>
                    </nav>
                </div>
            </header>
        </div>
    );
};

const styles = {
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    },
    topBar: {
        backgroundColor: '#3C6E69',
        color: '#fff',
        padding: '8px 0',
        fontSize: '13px',
        fontWeight: '500',
    },
    topBarLeft: {
        display: 'flex',
        gap: '20px',
    },
    topBarRight: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
    },
    socialIcon: {
        color: '#fff',
        fontSize: '12px',
        opacity: 0.9,
    },
    header: {
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '15px 0',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
    },
    logo: {
        height: '65px', // Increased size
        objectFit: 'contain',
    },
    nav: {
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
    },
    navList: {
        display: 'flex',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        gap: '35px',
    },
    navLink: {
        textDecoration: 'none',
        fontSize: '14px',
        fontFamily: "'Poppins', sans-serif",
        fontWeight: '600', // Bold text
        transition: 'color 0.2s',
        letterSpacing: '0.5px',
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        marginLeft: 'auto', // Push to the right
        paddingLeft: '0',
        borderLeft: 'none',
    },
    userName: {
        fontSize: '13px',
        color: '#666',
        fontWeight: '500',
    },
    logoutBtn: {
        backgroundColor: '#3C6E69', // Teal background
        border: 'none',
        color: '#fff',
        padding: '8px 20px',
        borderRadius: '4px', // Slightly rounded
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '1px',
        transition: 'all 0.2s',
        textTransform: 'uppercase',
        marginTop: '-2px', // Slight lift to align with text
    }
};

export default TopNavigation;
