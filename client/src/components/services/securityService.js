// services/securityService.js
class SecurityService {
  constructor() {
    this.violations = JSON.parse(localStorage.getItem('security-violations') || '[]');
  }

  async logViolation(userId, path, reason) {
    const violation = {
      id: Date.now(),
      userId,
      path,
      reason,
      timestamp: new Date().toISOString(),
      ip: await this.getUserIP(),
      userAgent: navigator.userAgent,
    };

    this.violations.unshift(violation);
    this.saveViolations();
    
    console.warn('🛡️ Security Violation:', violation);
    return violation;
  }

  async getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  loadViolations() {
    return Promise.resolve(this.violations);
  }

  saveViolations() {
    localStorage.setItem('security-violations', JSON.stringify(this.violations));
  }

  clearViolations() {
    this.violations = [];
    this.saveViolations();
  }

  getViolationsByUser(userId) {
    return this.violations.filter(v => v.userId === userId);
  }
}

export default new SecurityService();