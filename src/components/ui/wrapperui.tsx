export const WrapperUI = () => {
    return (
        <div className="wrapper">
            <div className="content">
                <div className="header">
                    <h1>Agent AI</h1>
                </div>
                <div className="body">
                    <div className="sidebar">
                        <div className="sidebar-header">
                            <h2>Navigation</h2>
                        </div>
                        <div className="sidebar-body">
                            <ul>
                                <li><a href="#">Home</a></li>
                                <li><a href="#">About</a></li>
                                <li><a href="#">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="main">
                        <div className="main-header">
                            <h2>Welcome to Agent AI</h2>
                        </div>
                        <div className="main-body">
                            <p>Agent AI is a powerful tool for automating tasks and improving efficiency.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
