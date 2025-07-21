# CCA Portal - Application Security Project

A modern, secure web application for Club & Community Administration built with Express.js backend and Astro frontend, featuring role-based authentication and beautiful UI design.

## 🚀 Features

- **Role-Based Authentication**: Secure login system with JWT tokens
- **Multiple User Roles**: Member, President, Treasurer, Secretary
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Real-time Feedback**: Toast notifications for user actions
- **Secure API**: Protected routes with middleware authentication
- **Single Server**: Integrated Express + Astro SSR in one application

## 🏗️ Architecture

This application combines:
- **Backend**: Express.js with MongoDB (Mongoose)
- **Frontend**: Astro with SSR (Server-Side Rendering)
- **Styling**: Tailwind CSS with custom components
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: MongoDB for user data storage

## 📁 Project Structure

```
APPSECNew/
├── controller/
│   └── authFunctions.js     # Authentication logic
├── database/
│   └── member.js            # Mongoose schema
├── routes/
│   └── userRouter.js        # Express API routes
├── src/                     # Astro source files
│   ├── layouts/
│   │   └── Layout.astro     # Base layout with global styles
│   └── pages/
│       ├── index.astro      # Landing page
│       ├── login.astro      # Login page
│       ├── register.astro   # Registration page
│       ├── member.astro     # Member dashboard
│       ├── president.astro  # President dashboard
│       ├── treasurer.astro  # Treasurer dashboard
│       └── secretary.astro  # Secretary dashboard
├── dist/                    # Astro build output (auto-generated)
├── OLDPUB/                  # Previous static files (backup)
├── server.js                # Main server file
├── astro.config.mjs         # Astro configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
DB_CONNECT=mongodb://localhost:27017/cca_portal
APP_SECRET=your-super-secure-jwt-secret-key
PORT=3000
```

### 3. Database Setup

Make sure MongoDB is running. The application will automatically connect to the database specified in `DB_CONNECT`.

### 4. Build the Application

```bash
npm run build
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎯 Usage

### Registration

1. Navigate to `/register`
2. Fill in your details:
   - Full Name
   - Email Address
   - Password (minimum 6 characters)
   - Select your role (Member, President, Treasurer, Secretary)
3. Accept terms and conditions
4. Click "Create Account"

### Login

1. Navigate to `/login`
2. Enter your username and password
3. Select your role
4. Click "Sign In"

### Role-Based Dashboards

After successful login, users are redirected to their role-specific dashboard:

- **Member** (`/member`): Basic member resources and activities
- **President** (`/president`): Executive controls and member management
- **Treasurer** (`/treasurer`): Financial oversight and budget management
- **Secretary** (`/secretary`): Document management and meeting coordination

## 🔒 API Endpoints

### Authentication Routes

- `POST /api/register-member` - Register new member
- `POST /api/register-president` - Register new president
- `POST /api/register-treasurer` - Register new treasurer
- `POST /api/register-secretary` - Register new secretary
- `POST /api/login-member` - Member login
- `POST /api/login-president` - President login
- `POST /api/login-treasurer` - Treasurer login
- `POST /api/login-secretary` - Secretary login

### Protected Routes

- `GET /api/member-protected` - Member-only access
- `GET /api/president-protected` - President-only access
- `GET /api/treasurer-protected` - Treasurer-only access
- `GET /api/secretary-protected` - Secretary-only access

### Request Format

**Registration:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Login:**
```json
{
  "name": "John Doe",
  "password": "securepassword"
}
```

**Protected Route Headers:**
```
Authorization: Bearer <jwt_token>
```

## 🎨 UI Features

### Design Elements

- **Modern Glassmorphism**: Translucent cards with backdrop blur
- **Gradient Backgrounds**: Animated background decorations
- **Role-Specific Colors**: Each role has unique color schemes
- **Interactive Components**: Hover effects and smooth transitions
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Toast Notifications

The application includes a custom toast notification system:
- Success messages (green)
- Error messages (red)
- Info messages (blue)
- Auto-dismiss after 5 seconds
- Manual close option

### Form Validation

- Real-time client-side validation
- Password strength indicators
- Email format validation
- Required field checking
- Terms acceptance verification

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server (builds Astro + starts Express)
- `npm run build` - Build Astro application
- `npm start` - Production server (builds + starts)

### Development Workflow

1. Make changes to Astro pages in `src/pages/`
2. Modify API logic in `controller/` or `routes/`
3. Run `npm run dev` to rebuild and restart
4. Test functionality at `http://localhost:3000`

### Building for Production

1. Ensure environment variables are set
2. Run `npm run build`
3. Start with `npm start`

## 🐛 Troubleshooting

### Common Issues

**"Build Required" Message:**
- Run `npm run build` to generate Astro files
- Restart the server with `npm run dev`

**Database Connection Errors:**
- Verify MongoDB is running
- Check `DB_CONNECT` in `.env` file
- Ensure database credentials are correct

**Authentication Issues:**
- Verify `APP_SECRET` is set in `.env`
- Check JWT token expiration (default: 3 days)
- Clear browser localStorage if needed

**Port Conflicts:**
- Change `PORT` in `.env` file
- Default port is 3000

### Logs and Debugging

The application provides comprehensive logging:
- Server startup messages
- Database connection status
- Authentication attempts
- API request/response details

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds (12)
- **JWT Authentication**: Secure token-based sessions
- **Role-Based Access**: Middleware protection for routes
- **Input Validation**: Server-side request validation
- **CORS Protection**: Configured for security
- **Environment Variables**: Sensitive data protection

## 📦 Dependencies

### Core Dependencies

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token management
- `dotenv` - Environment variable management
- `astro` - Frontend framework
- `@astrojs/node` - Astro Node.js adapter
- `@astrojs/tailwind` - Tailwind CSS integration
- `tailwindcss` - Utility-first CSS framework

### Development Dependencies

- `nodemon` - Development server auto-restart

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**jafnz** - Application Security Project

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd APPSECNew

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build and start the application
npm run dev

# Visit http://localhost:3000
```

Enjoy your secure, modern CCA Portal! 🎉