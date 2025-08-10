// Toast通知システム
class ToastNotifications {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
        this.counter = 0;
    }

    // 通知コンテナを作成
    createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }

    // 成功通知
    success(message, duration = 5000) {
        this.show(message, 'success', duration);
    }

    // エラー通知
    error(message, duration = 7000) {
        this.show(message, 'error', duration);
    }

    // 警告通知
    warning(message, duration = 6000) {
        this.show(message, 'warning', duration);
    }

    // 情報通知
    info(message, duration = 5000) {
        this.show(message, 'info', duration);
    }

    // 通知を表示
    show(message, type = 'info', duration = 5000) {
        const id = `toast-${++this.counter}`;
        const notification = this.createNotification(id, message, type);
        
        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });

        // アニメーション開始
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // 自動削除
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }

        return id;
    }

    // 通知要素を作成
    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `toast-notification ${this.getTypeClasses(type)} transform translate-x-full transition-all duration-300 ease-in-out`;
        
        const icon = this.getIcon(type);
        
        notification.innerHTML = `
            <div class="flex items-start p-4 rounded-lg shadow-lg max-w-sm w-full">
                <div class="flex-shrink-0">
                    ${icon}
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-white">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button onclick="toastNotifications.remove('${id}')" class="text-white hover:text-gray-200 focus:outline-none">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        `;

        return notification;
    }

    // タイプ別クラスを取得
    getTypeClasses(type) {
        const classes = {
            success: 'bg-green-500 border-l-4 border-green-400',
            error: 'bg-red-500 border-l-4 border-red-400',
            warning: 'bg-yellow-500 border-l-4 border-yellow-400',
            info: 'bg-blue-500 border-l-4 border-blue-400'
        };
        return classes[type] || classes.info;
    }

    // タイプ別アイコンを取得
    getIcon(type) {
        const icons = {
            success: '<svg class="h-5 w-5 text-green-200" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
            error: '<svg class="h-5 w-5 text-red-200" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
            warning: '<svg class="h-5 w-5 text-yellow-200" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
            info: '<svg class="h-5 w-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
        };
        return icons[type] || icons.info;
    }

    // 通知を削除
    remove(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.element.classList.remove('show');
            notification.element.classList.add('translate-x-full');
            
            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    // すべての通知を削除
    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }

    // 特定のタイプの通知を削除
    clearByType(type) {
        this.notifications
            .filter(n => n.element.classList.contains(this.getTypeClasses(type).split(' ')[0]))
            .forEach(notification => {
                this.remove(notification.id);
            });
    }
}

// グローバルインスタンスを作成
const toastNotifications = new ToastNotifications();

// 既存のalert関数を置き換える（オプション）
window.showSuccess = (message) => toastNotifications.success(message);
window.showError = (message) => toastNotifications.error(message);
window.showWarning = (message) => toastNotifications.warning(message);
window.showInfo = (message) => toastNotifications.info(message);
