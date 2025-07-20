const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

class DocsController {
  
  // Serve API documentation
  static async getApiDocs(req, res, next) {
    try {
      const docsPath = path.join(__dirname, '../docs/api-documentation.md');
      const markdownContent = await fs.readFile(docsPath, 'utf8');
      
      // Convert markdown to HTML
      const htmlContent = marked(markdownContent);
      
      // Create a complete HTML page
      const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aplikasi Manajemen Umroh - API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            padding-left: 10px;
            border-left: 4px solid #3498db;
        }
        h3 {
            color: #7f8c8d;
            margin-top: 25px;
        }
        code {
            background-color: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
        }
        pre {
            background-color: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
            line-height: 1.5;
        }
        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .endpoint {
            background-color: #e8f4fd;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .method {
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 0.8em;
            margin-right: 10px;
        }
        .method.get { background-color: #27ae60; }
        .method.post { background-color: #e74c3c; }
        .method.put { background-color: #f39c12; }
        .method.patch { background-color: #9b59b6; }
        .method.delete { background-color: #e67e22; }
        .toc {
            background-color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 0;
        }
        .toc li {
            margin: 5px 0;
        }
        .toc a {
            color: #3498db;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        .badge {
            background-color: #95a5a6;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .status-code {
            color: #27ae60;
            font-weight: bold;
        }
        .error-code {
            color: #e74c3c;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="toc">
            <h3>📚 Quick Navigation</h3>
            <ul>
                <li><a href="#authentication">🔐 Authentication</a></li>
                <li><a href="#jamaah-management">👥 Jamaah Management</a></li>
                <li><a href="#package-management">📦 Package Management</a></li>
                <li><a href="#payment-management">💰 Payment Management</a></li>
                <li><a href="#group-management">🚌 Group Management</a></li>
                <li><a href="#document-management">📄 Document Management</a></li>
                <li><a href="#reports-and-analytics">📊 Reports & Analytics</a></li>
                <li><a href="#backup-management">💾 Backup Management</a></li>
                <li><a href="#system-monitoring">📈 System Monitoring</a></li>
            </ul>
        </div>
        ${htmlContent}
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d;">
            <p>Generated automatically from API documentation • Last updated: ${new Date().toLocaleDateString()}</p>
        </footer>
    </div>
    <script>
        // Add method badges to HTTP requests
        document.addEventListener('DOMContentLoaded', function() {
            const codeBlocks = document.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                const text = block.textContent;
                if (text.match(/^(GET|POST|PUT|PATCH|DELETE)\\s/)) {
                    const method = text.match(/^(GET|POST|PUT|PATCH|DELETE)/)[1];
                    const methodSpan = document.createElement('span');
                    methodSpan.className = 'method ' + method.toLowerCase();
                    methodSpan.textContent = method;
                    block.innerHTML = methodSpan.outerHTML + ' ' + text.substring(method.length);
                }
            });
        });
    </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(fullHTML);
    } catch (error) {
      next(error);
    }
  }

  // Get API schema in OpenAPI format
  static async getApiSchema(req, res, next) {
    try {
      const schema = {
        openapi: "3.0.0",
        info: {
          title: "Aplikasi Manajemen Umroh API",
          description: "REST API untuk sistem manajemen jamaah umroh",
          version: "1.0.0",
          contact: {
            name: "API Support",
            email: "support@umrohapp.com"
          }
        },
        servers: [
          {
            url: "http://localhost:5000/api",
            description: "Development server"
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT"
            }
          },
          schemas: {
            Jamaah: {
              type: "object",
              properties: {
                id: { type: "integer" },
                full_name: { type: "string" },
                nik: { type: "string" },
                gender: { type: "string", enum: ["M", "F"] },
                phone: { type: "string" },
                email: { type: "string" },
                package_id: { type: "integer" },
                jamaah_status: { type: "string", enum: ["registered", "confirmed", "departed"] },
                visa_status: { type: "string", enum: ["pending", "approved", "rejected"] },
                payment_status: { type: "string", enum: ["unpaid", "partial", "paid"] }
              }
            },
            Package: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                description: { type: "string" },
                price: { type: "number" },
                departure_date: { type: "string", format: "date" },
                return_date: { type: "string", format: "date" },
                max_capacity: { type: "integer" },
                current_capacity: { type: "integer" },
                is_active: { type: "boolean" }
              }
            },
            Payment: {
              type: "object",
              properties: {
                id: { type: "integer" },
                jamaah_id: { type: "integer" },
                amount: { type: "number" },
                payment_method: { type: "string" },
                payment_date: { type: "string", format: "date" },
                reference_number: { type: "string" },
                verified_by: { type: "integer" }
              }
            },
            Group: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                package_id: { type: "integer" },
                leader_jamaah_id: { type: "integer" },
                departure_date: { type: "string", format: "date" },
                bus_number: { type: "string" },
                gathering_point: { type: "string" },
                gathering_time: { type: "string" }
              }
            }
          }
        },
        paths: {
          "/auth/login": {
            post: {
              summary: "User login",
              tags: ["Authentication"],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        username: { type: "string" },
                        password: { type: "string" }
                      },
                      required: ["username", "password"]
                    }
                  }
                }
              },
              responses: {
                "200": {
                  description: "Login successful",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          success: { type: "boolean" },
                          data: {
                            type: "object",
                            properties: {
                              token: { type: "string" },
                              user: { type: "object" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "/jamaah": {
            get: {
              summary: "Get all jamaah",
              tags: ["Jamaah"],
              security: [{ bearerAuth: [] }],
              parameters: [
                {
                  name: "page",
                  in: "query",
                  schema: { type: "integer", default: 1 }
                },
                {
                  name: "limit",
                  in: "query",
                  schema: { type: "integer", default: 20 }
                },
                {
                  name: "package_id",
                  in: "query",
                  schema: { type: "integer" }
                }
              ],
              responses: {
                "200": {
                  description: "Success",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          success: { type: "boolean" },
                          data: {
                            type: "object",
                            properties: {
                              jamaah: {
                                type: "array",
                                items: { $ref: "#/components/schemas/Jamaah" }
                              },
                              pagination: { type: "object" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            post: {
              summary: "Create new jamaah",
              tags: ["Jamaah"],
              security: [{ bearerAuth: [] }],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Jamaah" }
                  }
                }
              },
              responses: {
                "201": { description: "Created" },
                "400": { description: "Validation error" }
              }
            }
          }
        }
      };

      res.json(schema);
    } catch (error) {
      next(error);
    }
  }

  // Get API status and endpoints summary
  static async getApiStatus(req, res, next) {
    try {
      const endpoints = [
        { group: 'Authentication', count: 4, path: '/auth' },
        { group: 'Jamaah Management', count: 8, path: '/jamaah' },
        { group: 'Package Management', count: 5, path: '/packages' },
        { group: 'Payment Management', count: 6, path: '/payments' },
        { group: 'Group Management', count: 10, path: '/groups' },
        { group: 'Document Management', count: 4, path: '/documents' },
        { group: 'Reports & Analytics', count: 6, path: '/reports' },
        { group: 'Family Relations', count: 8, path: '/family' },
        { group: 'Data Export/Import', count: 12, path: '/data' },
        { group: 'Backup Management', count: 8, path: '/backup' },
        { group: 'System Monitoring', count: 9, path: '/monitoring' },
        { group: 'User Management', count: 4, path: '/users' }
      ];

      const totalEndpoints = endpoints.reduce((sum, group) => sum + group.count, 0);

      const status = {
        api_version: "1.0.0",
        documentation_version: "1.0.0",
        total_endpoints: totalEndpoints,
        endpoint_groups: endpoints,
        authentication: "JWT Bearer Token",
        base_url: "/api",
        last_updated: new Date().toISOString(),
        features: [
          "Role-based access control (7 roles)",
          "Comprehensive audit logging",
          "Real-time notifications",
          "File upload/download",
          "Excel import/export",
          "Automated backups",
          "System monitoring",
          "Rate limiting",
          "Data validation",
          "Error handling"
        ]
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocsController;