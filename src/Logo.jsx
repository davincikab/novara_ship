const Logo = () => {
    return (
        <div
            className="logo-section z-[10] flex flex-shrink-0  items-center justify-center cursor-pointer"
            onClick={() => window.location.href = "https://globalsearoutes.net"}
        >
            <img src="/logo.png" alt="Novara Vessel" className='w-[45px]' />
        </div>
    );
};

export default Logo;