// Локальна версія ARButton з українськими написами та покращеним стилем
class UARButton {
    static createButton(renderer, sessionInit = {}) {
        const button = document.createElement('button');

        function showStartAR() {
            if (sessionInit.domOverlay === undefined) {
                const overlay = document.createElement('div');
                overlay.style.display = 'none';
                document.body.appendChild(overlay);

                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', 38);
                svg.setAttribute('height', 38);
                svg.style.position = 'absolute';
                svg.style.right = '20px';
                svg.style.top = '20px';
                svg.addEventListener('click', () => {
                    currentSession.end();
                });
                overlay.appendChild(svg);

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M 12,12 L 28,28 M 28,12 12,28');
                path.setAttribute('stroke', '#fff');
                path.setAttribute('stroke-width', 2);
                svg.appendChild(path);

                if (sessionInit.optionalFeatures === undefined) {
                    sessionInit.optionalFeatures = [];
                }

                sessionInit.optionalFeatures.push('dom-overlay');
                sessionInit.domOverlay = { root: overlay };
            }

            let currentSession = null;

            async function onSessionStarted(session) {
                session.addEventListener('end', onSessionEnded);
                renderer.xr.setReferenceSpaceType('local');
                await renderer.xr.setSession(session);
                button.textContent = 'ВИЙТИ';
                sessionInit.domOverlay.root.style.display = '';
                currentSession = session;
            }

            function onSessionEnded() {
                currentSession.removeEventListener('end', onSessionEnded);
                button.textContent = 'ЗАПУСК AR';
                sessionInit.domOverlay.root.style.display = 'none';
                currentSession = null;
            }

            button.style.display = '';
            button.style.cursor = 'pointer';
            button.textContent = 'ЗАПУСК AR';

            button.onmouseenter = () => {
                button.style.opacity = '1.0';
                button.style.transform = 'translateX(-50%) scale(1.05)';
            };

            button.onmouseleave = () => {
                button.style.opacity = '0.9';
                button.style.transform = 'translateX(-50%) scale(1)';
            };

            button.onclick = () => {
                if (currentSession === null) {
                    navigator.xr.requestSession('immersive-ar', sessionInit).then(onSessionStarted);
                } else {
                    currentSession.end();
                    if (navigator.xr.offerSession !== undefined) {
                        navigator.xr.offerSession('immersive-ar', sessionInit)
                            .then(onSessionStarted)
                            .catch(err => console.warn(err));
                    }
                }
            };

            if (navigator.xr.offerSession !== undefined) {
                navigator.xr.offerSession('immersive-ar', sessionInit)
                    .then(onSessionStarted)
                    .catch(err => console.warn(err));
            }
        }

        function disableButton() {
            button.style.display = '';
            button.style.cursor = 'auto';
            button.onmouseenter = null;
            button.onmouseleave = null;
            button.onclick = null;
        }

        function showARNotSupported() {
            disableButton();
            button.textContent = 'AR НЕ ПІДТРИМУЄТЬСЯ';
        }

        function showARNotAllowed(exception) {
            disableButton();
            console.warn('Exception when trying to call xr.isSessionSupported', exception);
            button.textContent = 'AR НЕ ДОЗВОЛЕНО';
        }

        function stylizeElement(element) {
            element.style.position = 'fixed';
            element.style.bottom = '20px';
            element.style.left = '50%';
            element.style.transform = 'translateX(-50%)';
            element.style.padding = '16px 32px';
            element.style.border = '2px solid #ffffff';
            element.style.borderRadius = '12px';
            element.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            element.style.color = '#ffffff';
            element.style.font = 'bold 18px system-ui, -apple-system, sans-serif';
            element.style.textAlign = 'center';
            element.style.opacity = '0.9';
            element.style.outline = 'none';
            element.style.zIndex = '1001';
            element.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            element.style.textTransform = 'uppercase';
            element.style.letterSpacing = '1px';
            element.style.transition = 'all 0.3s ease';
        }

        if ('xr' in navigator) {
            button.id = 'ARButton';
            button.style.display = 'none';
            stylizeElement(button);
            navigator.xr.isSessionSupported('immersive-ar').then(supported => {
                supported ? showStartAR() : showARNotSupported();
            }).catch(showARNotAllowed);
            return button;
        } else {
            const message = document.createElement('a');
            if (window.isSecureContext === false) {
                message.href = document.location.href.replace(/^http:/, 'https:');
                message.textContent = 'WEBXR ПОТРЕБУЄ HTTPS';
            } else {
                message.href = 'https://immersiveweb.dev/';
                message.textContent = 'WEBXR НЕДОСТУПНИЙ';
            }
            message.style.left = 'calc(50% - 90px)';
            message.style.width = '180px';
            message.style.textDecoration = 'none';
            stylizeElement(message);
            return message;
        }
    }
}

export { UARButton };