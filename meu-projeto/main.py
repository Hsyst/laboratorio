# Exemplo de código para seu projeto

from random import randint

code = randint(1, 11)
name = input("Digite seu nome: ")
idade = int(input("Digite sua idade: "))

if idade == int("18"):
  print("Olá {}, seu código de acesso é: {}".format(name, code))

else:
  print("Olá {}, infelizmente seu acesso foi negado")
