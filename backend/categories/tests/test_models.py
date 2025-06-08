from django.test import TestCase
from django.contrib.auth import get_user_model


class TestCategoriesModel(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.User = get_user_model()
        cls.email = "testemail@gmail.com"
        cls.password = "testpassword"
        cls.first_name = "Test"
        cls.last_name = "User"
        cls.user = cls.User(
            email=cls.email, first_name=cls.first_name, last_name=cls.last_name
        )
        cls.user.set_password(cls.password)
        cls.user.save()

    def test_something(self):
        self.assertEqual(1, 1)
