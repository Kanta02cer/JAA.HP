// エラーハンドリングユーティリティ
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
    }

    // エラーを処理
    handleError(error, context = '') {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: error.message || '不明なエラーが発生しました',
            stack: error.stack,
            context: context,
            type: error.name || 'Error'
        };

        // エラーログに追加
        this.logError(errorInfo);

        // コンソールに出力
        console.error('エラーが発生しました:', errorInfo);

        // ユーザーに通知
        this.notifyUser(errorInfo);

        return errorInfo;
    }

    // エラーをログに記録
    logError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // ログサイズを制限
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // ローカルストレージに保存（オプション）
        try {
            localStorage.setItem('error-log', JSON.stringify(this.errorLog));
        } catch (e) {
            console.warn('エラーログの保存に失敗:', e);
        }
    }

    // ユーザーにエラーを通知
    notifyUser(errorInfo) {
        let userMessage = 'エラーが発生しました';
        
        // エラータイプに応じてメッセージを調整
        switch (errorInfo.type) {
            case 'NetworkError':
                userMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
                break;
            case 'FirebaseError':
                userMessage = 'データベースエラーが発生しました。しばらく時間をおいてから再試行してください。';
                break;
            case 'AuthError':
                userMessage = '認証エラーが発生しました。再度ログインしてください。';
                break;
            case 'ValidationError':
                userMessage = '入力内容に問題があります。内容を確認してください。';
                break;
            default:
                if (errorInfo.message.includes('permission')) {
                    userMessage = '権限が不足しています。管理者に連絡してください。';
                } else if (errorInfo.message.includes('timeout')) {
                    userMessage = '処理がタイムアウトしました。しばらく時間をおいてから再試行してください。';
                } else if (errorInfo.message.includes('quota')) {
                    userMessage = '容量制限に達しました。不要なファイルを削除してください。';
                }
        }

        // Toast通知で表示
        if (typeof toastNotifications !== 'undefined') {
            toastNotifications.error(userMessage);
        } else {
            // フォールバック
            alert(userMessage);
        }
    }

    // エラーログを取得
    getErrorLog() {
        return [...this.errorLog];
    }

    // エラーログをクリア
    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('error-log');
        } catch (e) {
            console.warn('エラーログの削除に失敗:', e);
        }
    }

    // エラーログをエクスポート
    exportErrorLog() {
        const logData = {
            exportedAt: new Date().toISOString(),
            errors: this.errorLog
        };

        const blob = new Blob([JSON.stringify(logData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 非同期処理のラッパー
    async wrapAsync(operation, context = '') {
        try {
            return await operation();
        } catch (error) {
            return this.handleError(error, context);
        }
    }

    // フォームバリデーションエラーを処理
    handleValidationError(field, message) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: message,
            context: `Validation: ${field}`,
            type: 'ValidationError',
            field: field
        };

        this.logError(errorInfo);
        
        // フィールドにエラー表示
        this.showFieldError(field, message);
        
        return errorInfo;
    }

    // フィールドエラーを表示
    showFieldError(field, message) {
        const fieldElement = document.getElementById(field);
        if (fieldElement) {
            // 既存のエラーメッセージを削除
            const existingError = fieldElement.parentNode.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }

            // エラーメッセージを追加
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error text-red-600 text-sm mt-1';
            errorDiv.textContent = message;
            fieldElement.parentNode.appendChild(errorDiv);

            // フィールドにエラースタイルを適用
            fieldElement.classList.add('border-red-500');
            fieldElement.classList.remove('border-gray-300');

            // 3秒後にエラー表示を削除
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
                fieldElement.classList.remove('border-red-500');
                fieldElement.classList.add('border-gray-300');
            }, 3000);
        }
    }

    // ネットワークエラーを処理
    handleNetworkError(error, retryFunction = null, maxRetries = 3) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: 'ネットワークエラーが発生しました',
            context: 'Network',
            type: 'NetworkError',
            retryCount: 0
        };

        this.logError(errorInfo);

        if (retryFunction && errorInfo.retryCount < maxRetries) {
            errorInfo.retryCount++;
            
            // 指数バックオフでリトライ
            const delay = Math.pow(2, errorInfo.retryCount) * 1000;
            
            setTimeout(() => {
                retryFunction();
            }, delay);

            return `リトライ中... (${errorInfo.retryCount}/${maxRetries})`;
        }

        return 'ネットワークエラーが発生しました。しばらく時間をおいてから再試行してください。';
    }

    // 権限エラーを処理
    handlePermissionError(requiredPermission) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: `権限が不足しています: ${requiredPermission}`,
            context: 'Permission',
            type: 'PermissionError',
            requiredPermission: requiredPermission
        };

        this.logError(errorInfo);
        
        const message = `この操作を実行するには「${requiredPermission}」の権限が必要です。管理者に連絡してください。`;
        
        if (typeof toastNotifications !== 'undefined') {
            toastNotifications.error(message);
        } else {
            alert(message);
        }

        return errorInfo;
    }

    // エラー統計を取得
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            byContext: {},
            recent: this.errorLog.slice(-10) // 最近の10件
        };

        this.errorLog.forEach(error => {
            // タイプ別統計
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // コンテキスト別統計
            stats.byContext[error.context] = (stats.byContext[error.context] || 0) + 1;
        });

        return stats;
    }
}

// グローバルインスタンスを作成
const errorHandler = new ErrorHandler();

// 既存のエラーハンドリング関数を拡張
window.handleError = (error, context) => errorHandler.handleError(error, context);
window.showFieldError = (field, message) => errorHandler.showFieldError(field, message);
window.handleValidationError = (field, message) => errorHandler.handleValidationError(field, message);

// グローバルエラーハンドラーを設定
window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, 'Global');
});

window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(new Error(event.reason), 'UnhandledPromise');
});
