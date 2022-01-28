import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from 'styled-components';
import { 
  Container, 
  Header, 
  UserWrapper,
  UserInfo, 
  User, 
  UserGreeting, 
  UserName, 
  Photo,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadContainer,
} from './styles';
import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';
import { useAuth } from '../../hooks/auth';
  
export interface DataListProps extends TransactionCardProps {
  id: string;
}

interface HightLightProps {
  amount: string;
  lastTransaction: string;
}

interface HighLightData {
  entries: HightLightProps;
  expensives: HightLightProps;
  total: HightLightProps;
}

export function Dashboard(){
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [highLightData, setHighLightData] = useState<HighLightData>({} as HighLightData);

  const theme = useTheme();
  const { signOut, user } = useAuth();

  function getLastTransactionDate(collection: DataListProps[], type: 'positive' | 'negative'){
    const collectionFilttered = collection.filter(transaction => transaction.type === type);

    if(collectionFilttered.length === 0) return 0

    const lastTransaction = new Date(Math.max.apply(Math, collectionFilttered
      .map(transaction => new Date(transaction.date).getTime())
    ))
    
    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', {month: 'long'})}`
  }

  async function loadTransactions(){
    const dataKey = `@gofinance:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : []

    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormatted: DataListProps[] = transactions
      .map((item: DataListProps) => {
        if(item.type === 'positive'){
          entriesTotal += Number(item.amount);
        } else {
          expensiveTotal += Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
        const date = Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }).format(new Date(item.date));
  
        return {
          id: item.id,
          name: item.name,
          type: item.type,
          category: item.category,
          amount,
          date,
        }
      })

      setTransactions(transactionsFormatted);

      const lastTransactionEntries = getLastTransactionDate(transactions, 'negative');
      const lastTransactionExpensives = getLastTransactionDate(transactions, 'positive');
      const totalInterval = lastTransactionExpensives === 0 
        ? 'Não há transações' 
        : `01 a ${lastTransactionExpensives}`

      const total = entriesTotal - expensiveTotal;
      setHighLightData({
        entries: {
          amount: entriesTotal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}),
          lastTransaction: lastTransactionEntries === 0 
          ? 'Não há transações'  
          : `Última entrada ${lastTransactionEntries}`
        },
        expensives: {
          amount: expensiveTotal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}),
          lastTransaction: lastTransactionEntries === 0 
          ? 'Não há transações'  
          : `Última saída ${lastTransactionExpensives}`
        },
        total: {
          amount: total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}),
          lastTransaction: totalInterval
        }
      })

      setIsLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, [])

  useFocusEffect(useCallback(() => {
    loadTransactions();
  }, [] ));

  return (
    <Container>
      {isLoading ?
         <LoadContainer> 
          <ActivityIndicator color={theme.colors.primary} size="large" /> 
        </LoadContainer> :
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo source={{uri: user.photo}}/>
                <User>
                  <UserGreeting>Olá,</UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>

              <LogoutButton onPress={signOut}>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>

          <HighlightCards >
            <HighlightCard 
              type="up"
              title="Entradas" 
              amount={highLightData.entries.amount}
              lastTransaction={highLightData.entries.lastTransaction}
            />
            <HighlightCard 
              type="down"
              title="Saídas" 
              amount={highLightData.expensives.amount} 
              lastTransaction={highLightData.expensives.lastTransaction}
            />
            <HighlightCard
              type="total" 
              title="Total" 
              amount={highLightData.total.amount} 
              lastTransaction={highLightData.total.lastTransaction}
            />
          </HighlightCards>

          <Transactions>
            <Title>Listagem</Title>
            <TransactionList 
              data={transactions}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <TransactionCard data={item}/>}
            />
          </Transactions>
        </>
      }
    </Container>
  )
}
