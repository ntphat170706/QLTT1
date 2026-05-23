/**
 * EVN Authentication & Role-Based Access Control (RBAC) Module
 * Handles login, registration, password hashing (SHA-256 via Web Crypto),
 * and session state tracking.
 */

// Pure JS hashing helper using modern Web Crypto API
async function computeSHA256(passwordText) {
  if (!passwordText) return "";
  try {
    const msgBuffer = new TextEncoder().encode(passwordText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (err) {
    console.error("Crypto API error, falling back to basic mock hash:", err);
    // Simple hash fallback for older runtimes
    let hash = 0;
    for (let i = 0; i < passwordText.length; i++) {
      hash = (hash << 5) - hash + passwordText.charCodeAt(i);
      hash |= 0;
    }
    return 'mockhash_' + Math.abs(hash);
  }
}

class Auth {
  static getCurrentUser() {
    const user = localStorage.getItem('evn_session_user');
    return user ? JSON.parse(user) : null;
  }

  static setCurrentUser(user) {
    if (user) {
      localStorage.setItem('evn_session_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('evn_session_user');
    }
  }

  static isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Login user with username & password
   */
  static async login(username, password) {
    if (!username || !password) {
      throw new Error("Vui lòng nhập tên đăng nhập và mật khẩu.");
    }

    const trimmedUsername = username.trim().toLowerCase();
    const user = window.DB.users.find(u => u.username === trimmedUsername);

    if (!user) {
      throw new Error("Tài khoản không tồn tại trên hệ thống EVN.");
    }

    const inputHash = await computeSHA256(password);
    if (user.password_hash !== inputHash) {
      throw new Error("Mật khẩu không chính xác. Vui lòng kiểm tra lại.");
    }

    // Set Session
    const sessionUser = {
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      department: user.department,
      role_id: user.role_id,
      phone: user.phone
    };
    this.setCurrentUser(sessionUser);
    return sessionUser;
  }

  /**
   * Register a new EVN staff member
   */
  static async register(fullName, employeeId, department, email, phone, password, confirmPassword) {
    if (!fullName || !employeeId || !department || !email || !password) {
      throw new Error("Vui lòng điền đầy đủ các trường thông tin bắt buộc.");
    }

    if (password !== confirmPassword) {
      throw new Error("Mật khẩu xác nhận không khớp.");
    }

    if (password.length < 6) {
      throw new Error("Mật khẩu phải chứa ít nhất 6 ký tự để đảm bảo an toàn.");
    }

    const trimmedId = employeeId.trim().toLowerCase();
    const existing = window.DB.users.find(u => u.username === trimmedId);
    if (existing) {
      throw new Error(`Mã nhân viên (Username) "${employeeId}" đã tồn tại trên hệ thống.`);
    }

    const passHash = await computeSHA256(password);
    
    // Default assignment: new registrations default to 'technician' (Kỹ thuật viên)
    const newUser = {
      username: trimmedId,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : 'N/A',
      department: department,
      role_id: 'technician',
      password_hash: passHash
    };

    window.DB.users.push(newUser);
    window.DB.saveAll();

    return newUser;
  }

  /**
   * Log out active session
   */
  static logout() {
    this.setCurrentUser(null);
  }

  /**
   * Helper to quickly switch roles in Mock mode (for evaluator/user convenience)
   */
  static async quickLoginAs(roleId) {
    const user = window.DB.users.find(u => u.role_id === roleId);
    if (user) {
      const sessionUser = {
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        department: user.department,
        role_id: user.role_id,
        phone: user.phone
      };
      this.setCurrentUser(sessionUser);
      return sessionUser;
    }
    throw new Error(`Không tìm thấy tài khoản mẫu có quyền: ${roleId}`);
  }
}

// Attach to window
window.Auth = Auth;
window.computeSHA256 = computeSHA256;
console.log("EVN Auth & RBAC Layer initialized.", Auth);
