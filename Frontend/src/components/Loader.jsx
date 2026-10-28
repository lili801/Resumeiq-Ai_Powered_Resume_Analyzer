import styles from "./Loader.module.scss"

const Loader = ({ label = "Generating your interview plan" }) => {
    return (
        <div className={styles.loaderOverlay} role="status" aria-live="polite">
            <div className={styles.loaderPanel}>
                <div className={styles.loaderRing} aria-hidden="true">
                    <span />
                    <span />
                </div>
                <p>{label}</p>
            </div>
        </div>
    )
}

export default Loader
