
class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Headers CORS
        response["Access-Control-Allow-Origin"] = "https://spider-git-master-roger-alfanis-projects.vercel.app"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-CSRFToken"
        response["Access-Control-Max-Age"] = "86400"
        
        # Pour les requêtes OPTIONS (pré-flight)
        if request.method == "OPTIONS":
            response.status_code = 200
            response.content = ''
        
        return response