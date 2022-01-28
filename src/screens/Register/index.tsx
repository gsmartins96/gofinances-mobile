import React, { useState } from 'react';
import { Modal, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import uuid from 'react-native-uuid';
import { useNavigation } from '@react-navigation/native'
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup'
import { 
  Container,
  Header,
  Title,
  Form,
  Fields,
  TransactionTypes
} from './styles';

import { useAuth } from '../../hooks/auth';
import { InputForm } from '../../components/Form/InputForm';
import { Button } from '../../components/Form/Button';
import { TransactionTypeButton } from '../../components/Form/TransactionTypeButton';
import { CategorySelectButton } from '../../components/Form/CategorySelectButton';
import { CategorySelect } from '../CategorySelect'

interface FormData {
  name: string,
  amount: string
}

const schema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  amount: Yup
    .number()
    .typeError('Informe um valor número')
    .positive('Preço não pode ser negativo')
    .required('Valor é obrigatório'),
})

export function Register(){
  /* const navigation = useNavigation(); */
  const [transactionType, setTransactionType] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const { user } = useAuth();

  const [category, setCategory] = useState({
    key: 'category',
    name: 'Categoria',
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  function handleTransactionTypesSelect(type: 'positive' | 'negative'){
    setTransactionType(type);
  }

  function handleOpenSelectCategoryModal(){
    setCategoryModalOpen(true)
  }

  function handleCloseSelectCategoryModal(){
    setCategoryModalOpen(false)
  }

  async function handleRegister(form: FormData){
    if(!transactionType) 
      return Alert.alert('Selecione o tipo da transação');
    
    if(category.key === 'category') 
      return Alert.alert('Selecione a categoria');

    const newTransaction = {
      id: String(uuid.v4()),
      name: form.name,
      amount: form.amount,
      type: transactionType,
      category: category.key,
      date: new Date()
    }

    try{
      const dataKey = `@gofinance:transactions_user:${user.id}`
      const data = await AsyncStorage.getItem(dataKey);
      const currentData = data ? JSON.parse(data) : []
      const dataFormatted = [
        ...currentData,
        newTransaction
      ]

      await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));

      reset();
      setTransactionType('');
      setCategory({ key: 'category', name: 'Categoria' });

      navigation.navigate("Listagem" as never);
    }catch(error){
      console.log(error)
      Alert.alert("Não foi possível salvar");
    }
  }

  return(
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Container>
        <Header>
          <Title>Cadastro</Title>
        </Header>

        <Form>
          <Fields>
            <InputForm 
              placeholder="Nome" 
              name="name" 
              control={control} 
              autoCapitalize="sentences" 
              autoCorrect={false} 
              error={errors.name && errors.name.message}
            />
            <InputForm 
              placeholder="Preço" 
              name="amount" 
              control={control} 
              keyboardType="numeric"
              error={errors.amount && errors.amount.message}
            />

            <TransactionTypes>
              <TransactionTypeButton 
                title="Entrada" 
                type="up" 
                isActive={transactionType === 'positive'}
                onPress={() => handleTransactionTypesSelect('positive')} />
              <TransactionTypeButton 
                title="Saída" 
                type="down" 
                isActive={transactionType === 'negative'}
                onPress={() => handleTransactionTypesSelect('negative')} />
            </TransactionTypes>

            <CategorySelectButton 
              testID='button-categroy'
              title={category.name} 
              onPress={handleOpenSelectCategoryModal} 
            />
          </Fields>

          <Button title="Enviar" onPress={handleSubmit(handleRegister)} />
        </Form>
        
        <Modal testID='modal-category' visible={categoryModalOpen}>
          <CategorySelect 
            category={category} 
            setCategory={setCategory} 
            closeSelectCategory={handleCloseSelectCategoryModal} 
          />
        </Modal>
      </Container>
    </TouchableWithoutFeedback>
  );
}