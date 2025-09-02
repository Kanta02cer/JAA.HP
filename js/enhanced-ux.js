// =================================================================================
// Enhanced UX System - 魅力的なコーポレートサイトのためのUX機能
// パララックス効果、アニメーション、マイクロインタラクションを実装
// =================================================================================

class EnhancedUX {
    constructor() {
        this.isInitialized = false;
        this.parallaxElements = [];
        this.animatedElements = [];
        this.interactiveElements = [];
        this.scrollPosition = 0;
        this.isScrolling = false;
        this.init();
    }

    // 初期化
    init() {
        if (this.isInitialized) return;
        
        console.log('Enhanced UX System 初期化開始');
        
        // パララックス効果の設定
        this.setupParallax();
        
        // アニメーション要素の設定
        this.setupAnimations();
        
        // インタラクティブ要素の設定
        this.setupInteractiveElements();
        
        // スクロールイベントの設定
        this.setupScrollEvents();
        
        // リサイズイベントの設定
        this.setupResizeEvents();
        
        // 初期アニメーションの実行
        this.runInitialAnimations();
        
        this.isInitialized = true;
        console.log('Enhanced UX System 初期化完了');
    }

    // パララックス効果の設定
    setupParallax() {
        // パララックス対象要素を取得
        this.parallaxElements = document.querySelectorAll('[data-parallax]');
        
        this.parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            const direction = element.dataset.direction || 'up';
            
            element.style.transform = 'translateZ(0)';
            element.style.willChange = 'transform';
            
            // パララックス設定を保存
            element.parallaxConfig = { speed, direction };
        });
    }

    // アニメーション要素の設定
    setupAnimations() {
        // アニメーション対象要素を取得
        this.animatedElements = document.querySelectorAll('[data-animate]');
        
        this.animatedElements.forEach(element => {
            const animationType = element.dataset.animate;
            const delay = parseFloat(element.dataset.delay) || 0;
            const duration = parseFloat(element.dataset.duration) || 0.8;
            
            // 初期状態を設定
            element.style.opacity = '0';
            element.style.transform = this.getInitialTransform(animationType);
            element.style.transition = `all ${duration}s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s`;
            
            // アニメーション設定を保存
            element.animationConfig = { type: animationType, delay, duration };
        });
    }

    // インタラクティブ要素の設定
    setupInteractiveElements() {
        // インタラクティブ対象要素を取得
        this.interactiveElements = document.querySelectorAll('[data-interactive]');
        
        this.interactiveElements.forEach(element => {
            const interactiveType = element.dataset.interactive;
            
            switch (interactiveType) {
                case 'hover-lift':
                    this.setupHoverLift(element);
                    break;
                case 'ripple':
                    this.setupRippleEffect(element);
                    break;
                case 'magnetic':
                    this.setupMagneticEffect(element);
                    break;
                case 'tilt':
                    this.setupTiltEffect(element);
                    break;
            }
        });
    }

    // ホバー時の浮上効果
    setupHoverLift(element) {
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'translateY(-8px) scale(1.02)';
            element.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translateY(0) scale(1)';
            element.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });
    }

    // リップル効果
    setupRippleEffect(element) {
        element.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255,255,255,0.6);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    }

    // マグネット効果
    setupMagneticEffect(element) {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const moveX = x * 0.1;
            const moveY = y * 0.1;
            
            element.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translate(0, 0)';
        });
    }

    // 傾き効果
    setupTiltEffect(element) {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }

    // スクロールイベントの設定
    setupScrollEvents() {
        let ticking = false;
        
        const updateScroll = () => {
            this.scrollPosition = window.pageYOffset;
            this.updateParallax();
            this.updateScrollAnimations();
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateScroll);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestTick, { passive: true });
    }

    // リサイズイベントの設定
    setupResizeEvents() {
        let resizeTimer;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.updateParallax();
                this.updateScrollAnimations();
            }, 250);
        });
    }

    // パララックス効果の更新
    updateParallax() {
        this.parallaxElements.forEach(element => {
            const config = element.parallaxConfig;
            if (!config) return;
            
            const scrolled = this.scrollPosition;
            const rate = scrolled * config.speed;
            
            let transform = '';
            switch (config.direction) {
                case 'up':
                    transform = `translateY(${rate}px)`;
                    break;
                case 'down':
                    transform = `translateY(${-rate}px)`;
                    break;
                case 'left':
                    transform = `translateX(${rate}px)`;
                    break;
                case 'right':
                    transform = `translateX(${-rate}px)`;
                    break;
                case 'scale':
                    const scale = 1 + (scrolled * 0.0001);
                    transform = `scale(${scale})`;
                    break;
            }
            
            element.style.transform = transform;
        });
    }

    // スクロールアニメーションの更新
    updateScrollAnimations() {
        this.animatedElements.forEach(element => {
            if (this.isElementInViewport(element)) {
                this.triggerAnimation(element);
            }
        });
    }

    // 要素がビューポート内にあるかチェック
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        return (
            rect.top <= windowHeight * 0.8 &&
            rect.bottom >= 0
        );
    }

    // アニメーションをトリガー
    triggerAnimation(element) {
        if (element.classList.contains('animated')) return;
        
        element.classList.add('animated');
        element.style.opacity = '1';
        element.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
    }

    // 初期アニメーションの実行
    runInitialAnimations() {
        // ページ読み込み完了後に初期アニメーションを実行
        setTimeout(() => {
            this.animatedElements.forEach((element, index) => {
                setTimeout(() => {
                    this.triggerAnimation(element);
                }, index * 100);
            });
        }, 500);
    }

    // 初期状態のtransform値を取得
    getInitialTransform(animationType) {
        switch (animationType) {
            case 'fade-up':
                return 'translateY(30px)';
            case 'fade-down':
                return 'translateY(-30px)';
            case 'fade-left':
                return 'translateX(30px)';
            case 'fade-right':
                return 'translateX(-30px)';
            case 'scale-up':
                return 'scale(0.8)';
            case 'scale-down':
                return 'scale(1.2)';
            case 'rotate-left':
                return 'rotate(-15deg)';
            case 'rotate-right':
                return 'rotate(15deg)';
            default:
                return 'translateY(30px)';
        }
    }

    // カスタムアニメーションの実行
    runCustomAnimation(element, animationName, options = {}) {
        const defaultOptions = {
            duration: 1000,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            delay: 0
        };
        
        const config = { ...defaultOptions, ...options };
        
        element.style.transition = `all ${config.duration}ms ${config.easing} ${config.delay}ms`;
        
        // アニメーションクラスを追加
        element.classList.add(`animate-${animationName}`);
        
        // アニメーション完了後にクラスを削除
        setTimeout(() => {
            element.classList.remove(`animate-${animationName}`);
        }, config.duration + config.delay);
    }

    // パフォーマンス最適化
    optimizePerformance() {
        // スクロール中の処理を最適化
        if (this.isScrolling) return;
        
        this.isScrolling = true;
        setTimeout(() => {
            this.isScrolling = false;
        }, 100);
    }
}

// グローバルインスタンスを作成
window.enhancedUX = new EnhancedUX();

// ページ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
    // Enhanced UX Systemの初期化
    if (window.enhancedUX) {
        window.enhancedUX.init();
    }
});

// CSSアニメーションの定義
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .animate-bounce-in {
        animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    
    @keyframes bounceIn {
        0% {
            opacity: 0;
            transform: scale(0.3);
        }
        50% {
            opacity: 1;
            transform: scale(1.05);
        }
        70% {
            transform: scale(0.9);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .animate-slide-in-left {
        animation: slideInLeft 0.8s cubic-bezier(0.25, 1, 0.5, 1);
    }
    
    @keyframes slideInLeft {
        0% {
            opacity: 0;
            transform: translateX(-100px);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .animate-slide-in-right {
        animation: slideInRight 0.8s cubic-bezier(0.25, 1, 0.5, 1);
    }
    
    @keyframes slideInRight {
        0% {
            opacity: 0;
            transform: translateX(100px);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .animate-fade-in-up {
        animation: fadeInUp 0.8s cubic-bezier(0.25, 1, 0.5, 1);
    }
    
    @keyframes fadeInUp {
        0% {
            opacity: 0;
            transform: translateY(30px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-scale-in {
        animation: scaleIn 0.8s cubic-bezier(0.25, 1, 0.5, 1);
    }
    
    @keyframes scaleIn {
        0% {
            opacity: 0;
            transform: scale(0.5);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);
