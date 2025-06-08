from django.test import TestCase
from django.contrib.auth import get_user_model
from pathlib import Path
from os import getenv
from os.path import join
from dotenv import load_dotenv
from rest_framework.test import APIRequestFactory, force_authenticate
from .. import apis

class UsersApiTests(TestCase):
    
        @classmethod
        def setUpTestData(cls):
            env_path = join(str(Path(__file__).resolve().parent.parent.parent),"local.env")
            load_dotenv(env_path)
            cls.User = get_user_model()
            cls.email = "test1@gmail.com"
            cls.password = "testpassword"
            cls.admin_email = getenv('DJANGO_SUPERUSER_EMAIL')
            cls.admin_password = getenv('DJANGO_SUPERUSER_PASSWORD')
            cls.admin = cls.User.objects.create_superuser(email=cls.admin_email, password=cls.admin_password) # type: ignore
            
        def setUp(self):
            print("setUp: Run once for every test method to set up clean data.")
            self.factory = APIRequestFactory()

        
        def test_create_user(self):
            response = self.client.post('/api/register/', {"email": self.email, "password": self.password})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(self.User.objects.count(), 2)

        def test_login_user(self):
            # test login with admin correct credentials
            response = self.client.post('/api/login/', 
                                        {"email": self.admin_email, 
                                         "password": self.admin_password})
            self.assertEqual(response.status_code, 200)
            # test login with admin wrong password
            response = self.client.post('/api/login/', 
                                        {"email": self.admin_email, 
                                         "password": "wrongpassword"})
            self.assertEqual(response.status_code, 400)
            # test login with admin invalid email
            response = self.client.post('/api/login/', 
                                        {"email": "wrongemail", 
                                         "password": self.admin_password})
            self.assertEqual(response.status_code, 400)
            
            # test login with normal user before account validation by admin
            response = self.client.post('/api/login/', 
                                        {"email": self.email, 
                                         "password": self.password})
            self.assertEqual(response.status_code, 400)

        def test_validate_user(self):
            
            # Register a new user
            register_api = apis.RegisterUserApi.as_view()
            request = self.factory.post('/api/register/', {"email": self.email, "password": self.password})
            response = register_api(request)
            self.assertEqual(response.status_code, 200)

            # Validate the new user
            request = self.factory.put('/api/user/', 
                                        {"email": self.email, "is_staff": True})
            force_authenticate(request, user=self.admin)
            response = apis.UserApi.as_view()(request)
            self.assertEqual(response.status_code, 200)

            # Log in as the new user
            response = self.client.post('/api/login/', 
                                        {"email": self.email, 
                                         "password": self.password})
            self.assertEqual(response.status_code, 200)
            

        
        def test_logout_user(self):
            # test logout with admin
            request = self.factory.post('/api/logout/')
            force_authenticate(request, user=self.admin)
            response = apis.LogoutUserApi.as_view()(request)
            self.assertEqual(response.status_code, 200)
            # test logout with normal user
            request = self.factory.post('/api/logout/')
            # create the user first
            self.client.post('/api/register/', {"email": self.email, "password": self.password})
            force_authenticate(request, user=self.User.objects.get(email=self.email))
            response = apis.LogoutUserApi.as_view()(request)
            self.assertEqual(response.status_code, 200)

        def test_get_user(self):
            # test get user with admin
            request = self.factory.get('/api/user/')
            force_authenticate(request, user=self.admin)
            response = apis.UserApi.as_view()(request)
            self.assertEqual(response.status_code, 200)
            # test get user with normal user
            request = self.factory.get('/api/user/')
            # create the user first
            self.client.post('/api/register/', {"email": self.email, "password": self.password})
            force_authenticate(request, user=self.User.objects.get(email=self.email))
            response = apis.UserApi.as_view()(request)
            self.assertEqual(response.status_code, 200)
            
        def test_get_users_list(self):
            # test get users list with admin
            request = self.factory.get('/api/users_list/')
            force_authenticate(request, user=self.admin)
            response = apis.ListUsersApi.as_view()(request)
            self.assertEqual(response.status_code, 200)

            # test get users list with normal user
            request = self.factory.get('/api/users_list/')
            # create the user first
            self.client.post('/api/register/', {"email": self.email, "password": self.password})
            force_authenticate(request, user=self.User.objects.get(email=self.email))
            response = apis.ListUsersApi.as_view()(request)
            self.assertEqual(response.status_code, 401)

        def test_delete_user(self):
            self.client.post('/api/register/', {"email": self.email, "password": self.password})
            # test delete user with admin
            request = self.factory.delete('/api/user/', {"email_to_delete": self.email})
            force_authenticate(request, user=self.admin)
            response = apis.UserApi.as_view()(request)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(self.User.objects.all().count(), 1)

            # test delete user with normal user
            self.client.post('/api/register/', {"email": self.email, "password": self.password})
            request = self.factory.delete('/api/user/', {"email_to_delete": self.admin_email})
            force_authenticate(request, user=self.User.objects.get(email=self.email))
            response = apis.UserApi.as_view()(request)
            self.assertEqual(response.status_code, 401)
            self.assertEqual(self.User.objects.count(), 2)