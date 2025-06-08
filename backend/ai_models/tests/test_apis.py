from django.test import TestCase
from os import getenv
from os.path import join
from dotenv import load_dotenv
from pathlib import Path
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model


class TestAiModelsAPI(TestCase):
    @classmethod
    def setUpTestData(cls):
        env_path = join(str(Path(__file__).resolve().parent.parent.parent), "local.env")
        load_dotenv(env_path)
        cls.User = get_user_model()
        cls.email = "test1@gmail.com"
        cls.password = "testpassword"
        cls.admin_email = getenv("DJANGO_SUPERUSER_EMAIL")
        cls.admin_password = getenv("DJANGO_SUPERUSER_PASSWORD")
        cls.factory = APIRequestFactory()
